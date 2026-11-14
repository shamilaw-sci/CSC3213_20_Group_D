/**
 * @file    AIChatWidget.jsx
 * @module  Patient
 * @desc    Patient AI chat with language selection, conversation context and safety guidance.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AlertTriangle,
  Bot,
  Languages,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import api from '../../services/api';
import useAuthStore from '../../store/authStore';

/* QUICK PROMPTS */

const QUICK_PROMPTS = {
  English: [
    'How do I book a doctor?',
    'Where can I find my lab reports?',
    'Give me basic first-aid guidance.',
  ],

  Sinhala: [
    'වෛද්‍යවරයෙකු වෙන්කර ගන්නේ කොහොමද?',
    'මගේ පරීක්ෂණ වාර්තා කොහේද?',
    'මූලික ප්‍රථමාධාර උපදෙස් දෙන්න.',
  ],
};

/* MARKDOWN COMPONENTS */

/* eslint-disable no-unused-vars */

const MarkdownComponents = {
  p: ({
    node,
    ...props
  }) => (
    <p
      className="
        mb-2
        last:mb-0
        leading-6
      "
      {...props}
    />
  ),

  ul: ({
    node,
    ...props
  }) => (
    <ul
      className="
        list-disc
        ml-5
        mb-3
        space-y-1.5
      "
      {...props}
    />
  ),

  ol: ({
    node,
    ...props
  }) => (
    <ol
      className="
        list-decimal
        ml-5
        mb-3
        space-y-1.5
      "
      {...props}
    />
  ),

  li: ({
    node,
    ...props
  }) => (
    <li
      className="
        pl-1
        leading-5
      "
      {...props}
    />
  ),

  h1: ({
    node,
    ...props
  }) => (
    <h1
      className="
        text-base
        font-bold
        text-[#12344D]
        mt-4
        mb-2
      "
      {...props}
    />
  ),

  h2: ({
    node,
    ...props
  }) => (
    <h2
      className="
        text-[15px]
        font-bold
        text-[#12344D]
        mt-4
        mb-2
      "
      {...props}
    />
  ),

  h3: ({
    node,
    ...props
  }) => (
    <h3
      className="
        text-sm
        font-bold
        text-[#12344D]
        mt-4
        mb-2
      "
      {...props}
    />
  ),

  strong: ({
    node,
    ...props
  }) => (
    <strong
      className="
        font-bold
        text-foreground
      "
      {...props}
    />
  ),

  a: ({
    node,
    ...props
  }) => (
    <a
      className="
        text-primary
        font-semibold
        underline
        underline-offset-2
      "
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),

  /* Backend prompts now prohibit Markdown tables for patient chat, but this fallback renderer prevents a malformed response from breaking the web layout if one is ever returned. */
  table: ({
    node,
    ...props
  }) => (
    <div
      className="
        max-w-full
        overflow-x-auto
        my-3
        rounded-xl
        border
        border-border
      "
    >
      <table
        className="
          min-w-[620px]
          w-full
          text-xs
          border-collapse
        "
        {...props}
      />
    </div>
  ),

  thead: ({
    node,
    ...props
  }) => (
    <thead
      className="
        bg-secondary
      "
      {...props}
    />
  ),

  th: ({
    node,
    ...props
  }) => (
    <th
      className="
        px-3
        py-2.5
        text-left
        font-bold
        text-foreground
        whitespace-nowrap
      "
      {...props}
    />
  ),

  tbody: ({
    node,
    ...props
  }) => (
    <tbody
      className="
        divide-y
        divide-border
      "
      {...props}
    />
  ),

  td: ({
    node,
    ...props
  }) => (
    <td
      className="
        px-3
        py-2.5
        align-top
        text-muted-foreground
        min-w-36
      "
      {...props}
    />
  ),
};

/* eslint-enable no-unused-vars */

/* AI CHAT WIDGET */

export default function AIChatWidget() {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    isFullScreen,
    setIsFullScreen,
  ] = useState(false);

  const [
    messages,
    setMessages,
  ] = useState([
    {
      id: 1,

      sender:
        'ai',

      text:
        'Hello! I am the Care4U AI Assistant. I can help you navigate Care4U and provide basic first-aid information. How can I help you today?',
    },
  ]);

  const [
    inputText,
    setInputText,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    language,
    setLanguage,
  ] = useState(
    'English'
  );

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  /* AUTO SCROLL */

  useEffect(
    () => {
      messagesEndRef
        .current
        ?.scrollIntoView({
          behavior:
            'smooth',
        });
    },
    [
      messages,
      isLoading,
    ]
  );

  /* FOCUS INPUT WHEN OPENING */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }

      const timer =
        setTimeout(
          () => {
            inputRef
              .current
              ?.focus();
          },
          250
        );

      return () =>
        clearTimeout(
          timer
        );
    },
    [
      isOpen,
    ]
  );

  /* LANGUAGE */

  const toggleLanguage =
    () => {
      setLanguage(
        previous =>
          previous ===
          'English'
            ? 'Sinhala'
            : 'English'
      );
    };

  /* SEND MESSAGE */

  /**
   * FEATURE: Send a patient AI chat message
   * LOGIC: Ignore blank text or another send while loading; require a patient ID.
   * Send the new message, selected language and previous local messages to the patient chat API.
   * Append the reply or failure message and release loading; closing the widget keeps local history.
   * The visible safety notice remains present; provider guardrails run on the backend.
   */
  const sendMessage =
    async (
      messageOverride = null
    ) => {
      const messageText =
        (
          messageOverride ??
          inputText
        ).trim();

      if (
        !messageText ||
        isLoading
      ) {
        return;
      }

      if (
        !patientId
      ) {
        setMessages(
          previous => [
            ...previous,

            {
              id:
                Date.now(),

              sender:
                'ai',

              text:
                'I could not identify your patient account. Please sign in again and try once more.',
            },
          ]
        );

        return;
      }

      const userMessage = {
        id:
          Date.now(),

        sender:
          'user',

        text:
          messageText,
      };

      /* Map the web UI format into the chat-history format expected by the backend. */
      const formattedHistory =
        messages.map(
          message => ({
            role:
              message.sender,

            content:
              message.text,
          })
        );

      setMessages(
        previous => [
          ...previous,
          userMessage,
        ]
      );

      setInputText(
        ''
      );

      setIsLoading(
        true
      );

      try {
        const response =
          await api.post(
            `/api/patients/${patientId}/chat`,
            {
              message:
                userMessage.text,

              language,

              history:
                formattedHistory,
            }
          );

        if (
          response.data.success
        ) {
          setMessages(
            previous => [
              ...previous,

              {
                id:
                  Date.now() +
                  1,

                sender:
                  'ai',

                text:
                  response.data
                    .data
                    .reply,
              },
            ]
          );

        } else {
          setMessages(
            previous => [
              ...previous,

              {
                id:
                  Date.now() +
                  1,

                sender:
                  'ai',

                text:
                  'Sorry, I could not complete that request. Please try again.',
              },
            ]
          );
        }

      } catch (
        error
      ) {
        console.error(
          'Chat API Error:',
          error
        );

        setMessages(
          previous => [
            ...previous,

            {
              id:
                Date.now() +
                1,

              sender:
                'ai',

              text:
                'I could not connect to the Care4U assistant. Please check your connection and try again.',
            },
          ]
        );

      } finally {
        setIsLoading(
          false
        );
      }
    };

  /* SUBMIT */

  const handleSubmit =
    event => {
      event.preventDefault();

      sendMessage();
    };

  /* TEXTAREA KEYBOARD BEHAVIOUR */

  const handleInputKeyDown =
    event => {
      if (
        event.key ===
          'Enter' &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendMessage();
      }
    };

  /* CLOSE */

  const closeChat =
    () => {
      setIsOpen(
        false
      );

      setIsFullScreen(
        false
      );
    };

  /* PAGE */

  return (
    <div
      className={`
        fixed
        z-50
        flex
        flex-col

        ${
          isFullScreen &&
          isOpen
            ? `
              inset-0
              bg-[#F6F8FA]
            `
            : `
              bottom-6
              right-6
              items-end
            `
        }
      `}
    >

      {/* CHAT WINDOW */}

      {isOpen && (

        <div
          className={`
            flex
            flex-col
            overflow-hidden
            bg-[#F6F8FA]
            transition-all
            duration-300

            ${
              isFullScreen
                ? `
                  w-full
                  h-full
                `
                : `
                  w-[calc(100vw-2rem)]
                  sm:w-[420px]
                  h-[640px]
                  max-h-[82vh]
                  mb-4
                  rounded-[1.75rem]
                  border
                  border-border/80
                  shadow-[0_24px_70px_rgba(15,23,42,0.20)]
                `
            }
          `}
        >

          {/* HEADER */}

          <div
            className="
              relative
              overflow-hidden
              shrink-0
              bg-[#12344D]
              text-white
              px-4
              sm:px-5
              py-4
            "
          >

            <div
              className="
                absolute
                -right-12
                -top-20
                w-48
                h-48
                rounded-full
                bg-primary/25
              "
            />

            <div
              className="
                absolute
                left-20
                -bottom-14
                w-28
                h-28
                rounded-full
                bg-white/5
              "
            />

            <div
              className="
                relative
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  min-w-0
                "
              >

                <div
                  className="
                    w-11
                    h-11
                    rounded-2xl
                    bg-white/10
                    border
                    border-white/10
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >

                  <Sparkles
                    size={21}
                    className="
                      text-[#A8E1DD]
                    "
                  />

                </div>

                <div className="min-w-0">

                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      text-[#A8E1DD]
                    "
                  >
                    Care4U AI
                  </p>

                  <h3
                    className="
                      text-[15px]
                      sm:text-base
                      font-bold
                      leading-tight
                      mt-0.5
                    "
                  >
                    AI Health Assistant
                  </h3>

                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                      mt-1
                    "
                  >

                    <span
                      className="
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-emerald-400
                      "
                    />

                    <span
                      className="
                        text-[10px]
                        text-white/65
                      "
                    >
                      Patient support
                    </span>

                  </div>

                </div>

              </div>

              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  shrink-0
                "
              >

                {/* Switch Assistant Language Button */}
                <button
                  type="button"
                  onClick={
                    toggleLanguage
                  }
                  className="
                    h-9
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-xl
                    bg-white/10
                    hover:bg-white/15
                    border
                    border-white/10
                    px-2.5
                    transition-colors
                  "
                  title="Switch assistant language"
                >

                  <Languages
                    size={14}
                  />

                  <span
                    className="
                      text-[10px]
                      font-bold
                    "
                  >
                    {language ===
                    'English'
                      ? 'සිංහල'
                      : 'EN'}
                  </span>

                </button>

                {/* AI Assistant Full Screen or Minimize Button */}
                <button
                  type="button"
                  onClick={() =>
                    setIsFullScreen(
                      previous =>
                        !previous
                    )
                  }
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-white/10
                    hover:bg-white/15
                    border
                    border-white/10
                    flex
                    items-center
                    justify-center
                    transition-colors
                  "
                  title={
                    isFullScreen
                      ? 'Minimize'
                      : 'Full screen'
                  }
                >

                  {isFullScreen ? (
                    <Minimize2
                      size={17}
                    />
                  ) : (
                    <Maximize2
                      size={17}
                    />
                  )}

                </button>

                {/* Close AI Assistant Button */}
                <button
                  type="button"
                  onClick={
                    closeChat
                  }
                  className="
                    w-9
                    h-9
                    rounded-xl
                    hover:bg-white/10
                    flex
                    items-center
                    justify-center
                    transition-colors
                  "
                  aria-label="Close AI Assistant"
                >

                  <X
                    size={20}
                  />

                </button>

              </div>

            </div>

          </div>

          {/* DISCLAIMER */}

          <div
            className="
              shrink-0
              flex
              items-start
              gap-2.5
              bg-amber-50
              border-b
              border-amber-100
              px-4
              py-3
            "
          >

            <div
              className="
                w-8
                h-8
                rounded-xl
                bg-white
                flex
                items-center
                justify-center
                shrink-0
                border
                border-amber-100
              "
            >

              <AlertTriangle
                size={15}
                className="
                  text-amber-600
                "
              />

            </div>

            <div className="min-w-0">

              <p
                className="
                  text-[11px]
                  font-bold
                  text-amber-800
                "
              >
                AI-generated, not a medical diagnosis
              </p>

              <p
                className="
                  text-[10px]
                  leading-4
                  text-amber-700/85
                  mt-0.5
                "
              >
                This assistant does not diagnose or prescribe. Consult a verified healthcare professional for medical advice or urgent concerns.
              </p>

            </div>

          </div>

          {/* CHAT HISTORY */}

          <div
            className="
              flex-1
              overflow-y-auto
              overscroll-contain
            "
          >

            <div
              className={`
                mx-auto
                w-full
                px-4
                sm:px-5
                py-5

                ${
                  isFullScreen
                    ? `
                      max-w-4xl
                      md:px-8
                      py-8
                    `
                    : ''
                }
              `}
            >

              {messages.map(
                message => {
                  const isUser =
                    message.sender ===
                    'user';

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={`
                        flex
                        items-end
                        gap-2
                        mb-5

                        ${
                          isUser
                            ? 'justify-end'
                            : 'justify-start'
                        }
                      `}
                    >

                      {!isUser && (

                        <div
                          className="
                            w-8
                            h-8
                            rounded-xl
                            bg-primary/10
                            text-primary
                            flex
                            items-center
                            justify-center
                            shrink-0
                            mb-0.5
                          "
                        >

                          <Bot
                            size={16}
                          />

                        </div>

                      )}

                      <div
                        className={`
                          max-w-[88%]
                          sm:max-w-[82%]
                          rounded-2xl
                          px-4
                          py-3
                          text-[13px]
                          sm:text-sm
                          leading-relaxed

                          ${
                            isUser
                              ? `
                                bg-[#12344D]
                                text-white
                                rounded-br-md
                                shadow-[0_6px_18px_rgba(18,52,77,0.12)]
                              `
                              : `
                                bg-white
                                text-foreground
                                border
                                border-border/80
                                rounded-bl-md
                                shadow-[0_5px_18px_rgba(15,23,42,0.035)]
                              `
                          }
                        `}
                      >

                        {!isUser && (

                          <p
                            className="
                              text-[8px]
                              font-bold
                              uppercase
                              tracking-[0.12em]
                              text-primary
                              mb-2
                            "
                          >
                            Care4U Assistant
                          </p>

                        )}

                        {isUser ? (

                          <p
                            className="
                              whitespace-pre-wrap
                              break-words
                            "
                          >
                            {message.text}
                          </p>

                        ) : (

                          /* AI Reply Markdown Display */ <ReactMarkdown
                            components={
                              MarkdownComponents
                            }
                            remarkPlugins={[
                              remarkGfm,
                            ]}
                          >
                            {message.text}
                          </ReactMarkdown>

                        )}

                      </div>

                      {isUser && (

                        <div
                          className="
                            w-8
                            h-8
                            rounded-xl
                            bg-[#12344D]
                            text-white
                            flex
                            items-center
                            justify-center
                            shrink-0
                            mb-0.5
                          "
                        >

                          <UserRound
                            size={15}
                          />

                        </div>

                      )}

                    </div>
                  );
                }
              )}

              {/* QUICK PROMPTS */}

              {messages.length ===
                1 &&
              !isLoading && (

                <div
                  className="
                    ml-10
                    mb-5
                  "
                >

                  <p
                    className="
                      text-[8px]
                      uppercase
                      tracking-[0.14em]
                      font-bold
                      text-muted-foreground
                      mb-2
                    "
                  >
                    Suggested Questions
                  </p>

                  <div
                    className="
                      flex
                      flex-col
                      items-start
                      gap-2
                    "
                  >

                    {QUICK_PROMPTS[
                      language
                    ].map(
                      prompt => (

                        /* Suggested Question Button */ <button
                          key={
                            prompt
                          }
                          type="button"
                          disabled={
                            isLoading
                          }
                          onClick={() =>
                            sendMessage(
                              prompt
                            )
                          }
                          className="
                            group
                            max-w-full
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-primary/10
                            bg-primary/5
                            hover:bg-primary/10
                            text-left
                            px-3
                            py-2.5
                            transition-colors
                          "
                        >

                          <Sparkles
                            size={13}
                            className="
                              text-primary
                              shrink-0
                            "
                          />

                          <span
                            className="
                              text-[11px]
                              font-semibold
                              leading-4
                              text-primary
                            "
                          >
                            {prompt}
                          </span>

                        </button>

                      )
                    )}

                  </div>

                </div>

              )}

              {/* LOADING */}

              {isLoading && (

                <div
                  className="
                    flex
                    items-end
                    gap-2
                    mb-5
                  "
                >

                  <div
                    className="
                      w-8
                      h-8
                      rounded-xl
                      bg-primary/10
                      text-primary
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >

                    <Bot
                      size={16}
                    />

                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-2xl
                      rounded-bl-md
                      bg-white
                      border
                      border-border/80
                      px-4
                      py-3
                      shadow-[0_5px_18px_rgba(15,23,42,0.035)]
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-1
                      "
                    >

                      <span
                        className="
                          w-1.5
                          h-1.5
                          rounded-full
                          bg-primary
                          animate-bounce
                        "
                      />

                      <span
                        className="
                          w-1.5
                          h-1.5
                          rounded-full
                          bg-primary
                          animate-bounce
                        "
                        style={{
                          animationDelay:
                            '150ms',
                        }}
                      />

                      <span
                        className="
                          w-1.5
                          h-1.5
                          rounded-full
                          bg-primary
                          animate-bounce
                        "
                        style={{
                          animationDelay:
                            '300ms',
                        }}
                      />

                    </div>

                    <span
                      className="
                        text-[10px]
                        font-medium
                        text-muted-foreground
                      "
                    >
                      Care4U is thinking…
                    </span>

                  </div>

                </div>

              )}

              <div
                ref={
                  messagesEndRef
                }
                className="h-1"
              />

            </div>

          </div>

          {/* INPUT AREA */}

          <div
            className="
              shrink-0
              border-t
              border-border
              bg-white
            "
          >

            <form
              onSubmit={
                handleSubmit
              }
              className={`
                mx-auto
                w-full
                px-3
                sm:px-4
                pt-3
                pb-2

                ${
                  isFullScreen
                    ? `
                      max-w-4xl
                      md:px-8
                      pt-4
                    `
                    : ''
                }
              `}
            >

              <div
                className="
                  flex
                  items-end
                  gap-2
                  rounded-2xl
                  border
                  border-border
                  bg-[#F8FAFB]
                  focus-within:border-primary/50
                  focus-within:ring-2
                  focus-within:ring-primary/10
                  pl-4
                  pr-1.5
                  py-1.5
                  transition-all
                "
              >

                <textarea
                  ref={
                    inputRef
                  }
                  value={
                    inputText
                  }
                  onChange={
                    event =>
                      setInputText(
                        event.target
                          .value
                      )
                  }
                  onKeyDown={
                    handleInputKeyDown
                  }
                  rows={1}
                  maxLength={500}
                  disabled={
                    isLoading
                  }
                  placeholder={
                    language ===
                    'English'
                      ? 'Ask Care4U anything...'
                      : 'Care4U වෙතින් අසන්න...'
                  }
                  className="
                    flex-1
                    min-h-11
                    max-h-28
                    resize-none
                    bg-transparent
                    py-3
                    text-sm
                    leading-5
                    text-foreground
                    placeholder:text-muted-foreground
                    outline-none
                    disabled:opacity-60
                  "
                />

                {/* Send AI Chat Message Button */}
                <button
                  type="submit"
                  disabled={
                    !inputText.trim() ||
                    isLoading
                  }
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-primary
                    text-primary-foreground
                    flex
                    items-center
                    justify-center
                    disabled:bg-slate-300
                    disabled:text-white
                    disabled:cursor-not-allowed
                    hover:opacity-90
                    transition-all
                    shrink-0
                  "
                  aria-label="Send message"
                >

                  <Send
                    size={17}
                  />

                </button>

              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  px-1
                  pt-2
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    min-w-0
                  "
                >

                  <ShieldCheck
                    size={12}
                    className="
                      text-muted-foreground
                      shrink-0
                    "
                  />

                  <span
                    className="
                      text-[9px]
                      text-muted-foreground
                      truncate
                    "
                  >
                    Care4U patient assistant
                  </span>

                </div>

                <span
                  className="
                    text-[9px]
                    font-medium
                    text-muted-foreground
                    shrink-0
                  "
                >
                  {inputText.length}/500
                </span>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* FLOATING LAUNCH BUTTON */}

      {!isOpen && (

        /* Open Care4U AI Assistant Button */ <button
          type="button"
          onClick={() =>
            setIsOpen(
              true
            )
          }
          className="
            group
            relative
            w-16
            h-16
            rounded-full
            bg-primary
            text-primary-foreground
            border-[3px]
            border-background
            shadow-[0_12px_34px_rgba(15,139,131,0.28)]
            flex
            items-center
            justify-center
            hover:scale-105
            active:scale-95
            transition-transform
          "
          aria-label="Open Care4U AI Assistant"
        >

          <MessageCircle
            size={27}
          />

          <span
            className="
              absolute
              top-1
              right-1
              w-3
              h-3
              rounded-full
              bg-emerald-400
              border-2
              border-primary
            "
          />

        </button>

      )}

    </div>
  );
}