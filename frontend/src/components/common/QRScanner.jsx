/**
 * @component QRScanner
 * @desc      Reusable camera-based QR scanner component.
 *            Used for prescription QR codes and
 *            patient identity QR codes.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Camera,
  CameraOff,
  ScanLine,
  XCircle,
} from 'lucide-react';

import {
  Html5Qrcode,
} from 'html5-qrcode';

import Button from './Button';
import Alert from './Alert';

const QRScanner = ({
  onScan,
  onClose,
  title = 'Scan QR code',
  description = 'Point the camera at the QR code.',
}) => {

  /**
   * Unique DOM ID for this scanner instance.
   */
  const scannerIdRef =
    useRef(
      `care4u-qr-reader-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`
    );

  /**
   * Stores the Html5Qrcode instance.
   */
  const scannerInstanceRef =
    useRef(null);

  /**
   * Tracks whether the camera is actually running.
   */
  const isRunningRef =
    useRef(false);

  /**
   * Prevents multiple scan callbacks.
   */
  const scannedRef =
    useRef(false);

  /**
   * Tracks whether component has been unmounted.
   */
  const destroyedRef =
    useRef(false);

  const [
    cameraStarted,
    setCameraStarted,
  ] = useState(false);

  const [
    scannerError,
    setScannerError,
  ] = useState(null);

  /**
   * Safely stops and clears the scanner.
   */
  const stopScanner = async () => {
    const scanner =
      scannerInstanceRef.current;

    if (!scanner) {
      return;
    }

    try {

      /**
       * Only call stop() if start()
       * completed successfully.
       */
      if (isRunningRef.current) {
        await scanner.stop();

        isRunningRef.current =
          false;
      }

    } catch (error) {
      console.warn(
        'QR scanner stop warning:',
        error
      );
    }

    try {

      scanner.clear();

    } catch (error) {
      console.warn(
        'QR scanner clear warning:',
        error
      );
    }

    scannerInstanceRef.current =
      null;

    if (!destroyedRef.current) {
      setCameraStarted(false);
    }
  };

  /**
   * Starts the QR camera.
   */
  const startScanner = async () => {

    setScannerError(null);

    scannedRef.current =
      false;

    try {

      /**
       * Clean up an old scanner
       * before creating a new one.
       */
      await stopScanner();

      /**
       * Give React time to ensure the
       * scanner DIV exists in the DOM.
       */
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 100)
      );

      if (destroyedRef.current) {
        return;
      }

      const element =
        document.getElementById(
          scannerIdRef.current
        );

      if (!element) {
        throw new Error(
          'QR scanner container is not available.'
        );
      }

      const scanner =
        new Html5Qrcode(
          scannerIdRef.current
        );

      scannerInstanceRef.current =
        scanner;

      /**
       * Prefer the rear-facing camera.
       * This avoids depending on camera labels.
       */
      await scanner.start(
        {
          facingMode:
            'environment',
        },
        {
          fps: 10,

          qrbox: {
            width: 250,
            height: 250,
          },

          aspectRatio: 1,
        },

        async (
          decodedText
        ) => {

          /**
           * Ignore duplicate detections.
           */
          if (
            scannedRef.current
          ) {
            return;
          }

          scannedRef.current =
            true;

          /**
           * Mark as running before
           * safely stopping.
           */
          isRunningRef.current =
            true;

          await stopScanner();

          if (
            onScan &&
            !destroyedRef.current
          ) {
            onScan(
              decodedText
            );
          }
        },

        () => {
          /**
           * Decode errors are expected while
           * the camera is searching for a QR.
           * Do not display them.
           */
        }
      );

      /**
       * The component may have unmounted
       * while camera permission was opening.
       */
      if (destroyedRef.current) {

        try {
          await scanner.stop();
        } catch {
          // Ignore cleanup errors
        }

        return;
      }

      isRunningRef.current =
        true;

      setCameraStarted(true);

    } catch (error) {

      console.error(
        'QR scanner start error:',
        error
      );

      isRunningRef.current =
        false;

      if (
        !destroyedRef.current
      ) {
        setCameraStarted(false);

        setScannerError(
          error?.message ||
          'Unable to start the camera. Please check camera permissions.'
        );
      }
    }
  };

  /**
   * Start scanner after the component
   * has fully mounted.
   */
  useEffect(() => {

    destroyedRef.current =
      false;

    const timer =
      setTimeout(() => {
        startScanner();
      }, 150);

    return () => {

      destroyedRef.current =
        true;

      clearTimeout(timer);

      const scanner =
        scannerInstanceRef.current;

      /**
       * Do not blindly call stop().
       * html5-qrcode throws if it is
       * not currently running.
       */
      if (
        scanner &&
        isRunningRef.current
      ) {
        scanner
          .stop()
          .catch(() => {});
      }

      isRunningRef.current =
        false;

      scannerInstanceRef.current =
        null;
    };

    // Run once for this scanner mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Close scanner safely.
   */
  const handleClose =
    async () => {

      await stopScanner();

      if (onClose) {
        onClose();
      }
    };

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">

        <div>

          <div className="flex items-center gap-2">

            <ScanLine
              size={20}
              className="text-primary"
            />

            <h2 className="text-base font-bold text-foreground">
              {title}
            </h2>

          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>

        </div>

        {onClose && (
          <button
            type="button"
            onClick={
              handleClose
            }
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close QR scanner"
          >

            <XCircle
              size={22}
            />

          </button>
        )}

      </div>

      {/* Camera */}
      <div className="rounded-xl overflow-hidden border border-border bg-black min-h-[280px]">

        <div
          id={
            scannerIdRef.current
          }
          className="w-full min-h-[280px]"
        />

      </div>

      {/* Camera running */}
      {cameraStarted && (
        <div className="mt-3 flex items-center gap-2 text-xs text-success">

          <Camera
            size={15}
          />

          Camera active — position the QR code inside the frame

        </div>
      )}

      {/* Starting */}
      {!cameraStarted &&
        !scannerError && (

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">

          <CameraOff
            size={15}
          />

          Starting camera...

        </div>

      )}

      {/* Error */}
      {scannerError && (
        <div className="mt-4">

          <Alert
            type="error"
            message={
              scannerError
            }
          />

          <div className="mt-3">

            <Button
              variant="secondary"
              icon={
                <Camera
                  size={16}
                />
              }
              onClick={
                startScanner
              }
            >
              Try Camera Again
            </Button>

          </div>

        </div>
      )}

    </div>
  );
};

export default QRScanner;
