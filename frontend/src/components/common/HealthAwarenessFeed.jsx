/**
 * @file    HealthAwarenessFeed.jsx
 * @module  Patient
 * @desc    Shows published health infographics selected using the supplied patient allergies.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Info,
  Pause,
  Play,
} from 'lucide-react';

import {
  getHealthContent,
  getPersonalizedFeed
} from '../../services/healthContentService';

import Card from './Card';

const AUTO_SCROLL_DELAY = 15000;

/**
 * FEATURE: Recommended health infographics
 * LOGIC: Fetch published content, rank/filter using patient allergies and keep only articles with images.
 * Restart at the first article when allergies change; errors and empty results share the empty display.
 * Rotate multiple articles every 15 seconds while unpaused; hovering/focusing pauses and swipes move slides.
 */
const HealthAwarenessFeed = ({
  patientAllergies = []
}) => {
  const [
    articles,
    setArticles
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  const [
    currentIndex,
    setCurrentIndex
  ] = useState(0);

  const [
    isPaused,
    setIsPaused
  ] = useState(false);

  const touchStartX =
    useRef(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load published awareness content.
        const data =
          await getHealthContent();

        // Keep article selection in the shared health-content service.
        const personalized =
          getPersonalizedFeed(
            data,
            patientAllergies
          );

        // The patient feed now presents complete infographic articles only.
        // Existing text-only content remains stored in the system/admin area.
        const infographicArticles =
          personalized.filter(
            article =>
              article.image_url
          );

        setArticles(
          infographicArticles
        );

        setCurrentIndex(0);
      } catch {
        setError(
          'Failed to load health feed.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [patientAllergies]);

  useEffect(() => {
    if (
      articles.length <= 1 ||
      isPaused
    ) {
      return undefined;
    }

    const interval =
      window.setInterval(
        () => {
          setCurrentIndex(
            previousIndex =>
              (
                previousIndex + 1
              ) %
              articles.length
          );
        },
        AUTO_SCROLL_DELAY
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    articles.length,
    isPaused
  ]);

  const goToPrevious = () => {
    if (
      articles.length === 0
    ) {
      return;
    }

    setCurrentIndex(
      previousIndex =>
        (
          previousIndex -
          1 +
          articles.length
        ) %
        articles.length
    );
  };

  const goToNext = () => {
    if (
      articles.length === 0
    ) {
      return;
    }

    setCurrentIndex(
      previousIndex =>
        (
          previousIndex + 1
        ) %
        articles.length
    );
  };

  const handleTouchStart = (
    event
  ) => {
    touchStartX.current =
      event.touches[0]
        ?.clientX ?? null;

    setIsPaused(true);
  };

  const handleTouchEnd = (
    event
  ) => {
    if (
      touchStartX.current === null
    ) {
      return;
    }

    const touchEndX =
      event.changedTouches[0]
        ?.clientX ?? touchStartX.current;

    const difference =
      touchStartX.current -
      touchEndX;

    if (
      Math.abs(
        difference
      ) > 45
    ) {
      if (
        difference > 0
      ) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartX.current =
      null;

    window.setTimeout(
      () =>
        setIsPaused(
          false
        ),
      2500
    );
  };

  if (loading) {
    return (
      <Card>

        <div className="flex items-center gap-3 mb-5">

          <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

            <HeartPulse
              size={19}
            />

          </div>

          <div>

            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Recommended Health Articles
            </h3>

            <p className="text-xs text-muted-foreground mt-0.5">
              Personalized health-awareness infographics
            </p>

          </div>

        </div>

        <div className="flex justify-center items-center min-h-56 rounded-xl bg-secondary/35">

          <span className="text-muted-foreground text-sm animate-pulse">
            Loading health infographics...
          </span>

        </div>

      </Card>
    );
  }

  if (
    error ||
    articles.length === 0
  ) {
    return (
      <Card>

        <div className="flex items-center gap-3 mb-5">

          <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

            <HeartPulse
              size={19}
            />

          </div>

          <div>

            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Recommended Health Articles
            </h3>

            <p className="text-xs text-muted-foreground mt-0.5">
              Personalized health-awareness infographics
            </p>

          </div>

        </div>

        <div className="flex flex-col items-center justify-center min-h-40 text-center rounded-xl bg-secondary/35 px-4">

          <Info className="h-6 w-6 text-muted-foreground mb-2" />

          <p className="text-muted-foreground text-sm">
            No health infographics are available at the moment. Check back later!
          </p>

        </div>

      </Card>
    );
  }

  return (
    <Card>

      <div className="flex items-center justify-between gap-4 mb-5">

        <div className="flex items-center gap-3 min-w-0">

          <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

            <HeartPulse
              size={19}
            />

          </div>

          <div className="min-w-0">

            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Recommended For You
            </h3>

            <p className="text-xs text-muted-foreground mt-0.5">
              Health infographics selected from published Care4U content
            </p>

          </div>

        </div>

        {/* Pause or Resume Health Slideshow Button */}
        <button
          type="button"
          onClick={() =>
            setIsPaused(
              previous =>
                !previous
            )
          }
          className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-primary hover:bg-module-soft transition-colors"
          aria-label={
            isPaused
              ? 'Resume automatic article rotation'
              : 'Pause automatic article rotation'
          }
          title={
            isPaused
              ? 'Resume slideshow'
              : 'Pause slideshow'
          }
        >
          {isPaused ? (
            <Play
              size={16}
            />
          ) : (
            <Pause
              size={16}
            />
          )}
        </button>

      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-secondary/25"
        onMouseEnter={() =>
          setIsPaused(
            true
          )
        }
        onMouseLeave={() =>
          setIsPaused(
            false
          )
        }
        onFocusCapture={() =>
          setIsPaused(
            true
          )
        }
        onBlurCapture={() =>
          setIsPaused(
            false
          )
        }
        onTouchStart={
          handleTouchStart
        }
        onTouchEnd={
          handleTouchEnd
        }
      >

        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform:
              `translateX(-${currentIndex * 100}%)`
          }}
        >

          {articles.map(
            (
              article,
              index
            ) => (
              <div
                key={
                  article.id ||
                  index
                }
                className="w-full shrink-0"
              >

                <div className="flex justify-center bg-secondary/20 p-2 sm:p-4">

                  <img
                    src={
                      article.image_url
                    }
                    alt={
                      article.title ||
                      'Care4U health infographic'
                    }
                    className="
                      block
                      w-auto
                      max-w-full
                      max-h-[78vh]
                      sm:max-h-[720px]
                      object-contain
                      rounded-xl
                      shadow-sm
                    "
                    loading={
                      index === 0
                        ? 'eager'
                        : 'lazy'
                    }
                  />

                </div>

              </div>
            )
          )}

        </div>

        {articles.length > 1 && (
          <>
            {/* Previous Health Infographic Button */}
            <button
              type="button"
              onClick={
                goToPrevious
              }
              className="
                absolute
                left-2 sm:left-3
                top-1/2
                -translate-y-1/2
                w-9 h-9 sm:w-10 sm:h-10
                rounded-full
                bg-black/45
                text-white
                backdrop-blur-sm
                flex items-center justify-center
                hover:bg-black/60
                transition-colors
                focus:outline-none
                focus:ring-2
                focus:ring-white/70
              "
              aria-label="Previous health infographic"
            >
              <ChevronLeft
                size={20}
              />
            </button>

            {/* Next Health Infographic Button */}
            <button
              type="button"
              onClick={
                goToNext
              }
              className="
                absolute
                right-2 sm:right-3
                top-1/2
                -translate-y-1/2
                w-9 h-9 sm:w-10 sm:h-10
                rounded-full
                bg-black/45
                text-white
                backdrop-blur-sm
                flex items-center justify-center
                hover:bg-black/60
                transition-colors
                focus:outline-none
                focus:ring-2
                focus:ring-white/70
              "
              aria-label="Next health infographic"
            >
              <ChevronRight
                size={20}
              />
            </button>
          </>
        )}

      </div>

      {articles.length > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div className="flex items-center justify-center sm:justify-start gap-2">

            {articles.map(
              (
                article,
                index
              ) => (
                <button
                  key={
                    article.id ||
                    index
                  }
                  type="button"
                  onClick={() =>
                    setCurrentIndex(
                      index
                    )
                  }
                  className={`
                    h-2.5
                    rounded-full
                    transition-all
                    ${
                      index ===
                      currentIndex
                        ? 'w-7 bg-primary'
                        : 'w-2.5 bg-border hover:bg-muted-foreground/40'
                    }
                  `}
                  aria-label={`Show health infographic ${index + 1}`}
                  aria-current={
                    index ===
                    currentIndex
                      ? 'true'
                      : undefined
                  }
                />
              )
            )}

          </div>

          <p className="text-center sm:text-right text-[11px] text-muted-foreground">
            {currentIndex + 1} of {articles.length}
            {' '}
            •
            {' '}
            Changes every 15 seconds
          </p>

        </div>
      )}

    </Card>
  );
};

export default HealthAwarenessFeed;
