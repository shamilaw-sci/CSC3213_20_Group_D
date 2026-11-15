/**
 * @file    AIChatScreen.js
 * @module  Patient
 * @desc    Patient AI chat with language selection, local conversation context and safety guidance.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import Markdown from 'react-native-markdown-display';

import {
  AlertTriangle,
  Bot,
  Languages,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react-native';

import api from '../services/api';
import useAuthStore from '../store/authStore';

/* DESIGN TOKENS */

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',

  text: '#102331',
  textSoft: '#334155',
  muted: '#718096',
  subtle: '#9AA8B6',

  border: '#E8EDF1',

  navy: '#12344D',
  navySoft: '#EAF1F5',

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  amber: '#B7791F',
  amberSoft: '#FFF8E7',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',
};

/* QUICK PROMPTS */

const QUICK_PROMPTS = {
  en: [
    'How do I book a doctor?',
    'Where can I find my lab reports?',
    'Give me basic first-aid guidance.',
  ],

  si: [
    'වෛද්‍යවරයෙකු වෙන්කර ගන්නේ කොහොමද?',
    'මගේ පරීක්ෂණ වාර්තා කොහේද?',
    'මූලික ප්‍රථමාධාර උපදෙස් දෙන්න.',
  ],
};

/* MAIN SCREEN */

const AIChatScreen = ({
  patientId,
}) => {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  // Use the explicit patient ID or signed-in profile; the backend must still check authorization.
  const activePatientId =
    patientId ||
    user?.profile_id ||
    user?.id ||
    '';

  const [
    messages,
    setMessages,
  ] = useState([
    {
      role: 'ai',
      content:
        'Hello! I am the Care4U AI Assistant. I can help you navigate Care4U and provide basic first-aid information. How can I help you today?',
    },
  ]);

  const [
    inputText,
    setInputText,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    language,
    setLanguage,
  ] = useState('en');

  const scrollViewRef =
    useRef(null);

  /* SEND MESSAGE */

  /**
   * FEATURE: Send a patient AI chat message
   * LOGIC: Ignore blank text or another send while loading and require a patient ID.
   * Copy previous messages before adding the new one; send that history, new text and chosen language.
   * Append the reply or failure message and release loading. Conversation state belongs to this screen.
   */
  const sendMessage =
    async (
      suppliedMessage = null
    ) => {
      const userMessage =
        (
          suppliedMessage ??
          inputText
        ).trim();

      if (
        !userMessage ||
        loading
      ) {
        return;
      }

      if (
        !activePatientId
      ) {
        setMessages(
          previous => [
            ...previous,
            {
              role: 'ai',
              content:
                'I could not identify your patient account. Please sign in again and try once more.',
            },
          ]
        );

        return;
      }

      // Send previous on-screen messages as context with the new prompt; it is not a stored diagnosis.
      const currentHistory =
        [
          ...messages,
        ];

      setInputText(
        ''
      );

      setMessages(
        previous => [
          ...previous,
          {
            role: 'user',
            content:
              userMessage,
          },
        ]
      );

      setLoading(
        true
      );

      try {
        const response =
          await api.post(
            `/api/patients/${activePatientId}/chat`,
            {
              message:
                userMessage,

              language:
                language ===
                'en'
                  ? 'English'
                  : 'Sinhala',

              history:
                currentHistory,
            }
          );

        if (
          response.data.success
        ) {
          setMessages(
            previous => [
              ...previous,
              {
                role: 'ai',
                content:
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
                role: 'ai',
                content:
                  'Sorry, I could not complete that request. Please try again.',
              },
            ]
          );
        }

      } catch (
        error
      ) {
        console.error(
          'AI Chat Error:',
          error
        );

        setMessages(
          previous => [
            ...previous,
            {
              role: 'ai',
              content:
                'I could not connect to the Care4U assistant. Please check your connection and try again.',
            },
          ]
        );

      } finally {
        setLoading(
          false
        );
      }
    };

  /* LANGUAGE */

  /**
   * Switch future chat requests between English and Sinhala; existing messages are not translated.
   */
  const toggleLanguage =
    () => {
      setLanguage(
        previous =>
          previous ===
          'en'
            ? 'si'
            : 'en'
      );
    };

  /* PAGE */

  return (
    <SafeAreaView style={styles.safeArea}>

      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS ===
          'ios'
            ? 90
            : 80
        }
      >

        {/* ASSISTANT INTRO */}

        <View style={styles.assistantCard}>

          <View style={styles.assistantIcon}>

            <Sparkles
              size={22}
              color={COLORS.teal}
            />

          </View>

          <View style={styles.assistantContent}>

            <Text style={styles.assistantEyebrow}>
              CARE4U AI ASSISTANT
            </Text>

            <Text style={styles.assistantTitle}>
              How can I help?
            </Text>

            <Text style={styles.assistantDescription}>
              Ask about Care4U features or basic first-aid information.
            </Text>

          </View>

          {/* Switch AI Assistant Language Button */}
          <TouchableOpacity
            style={styles.languageButton}
            activeOpacity={0.75}
            onPress={
              toggleLanguage
            }
          >

            <Languages
              size={15}
              color={COLORS.tealDark}
            />

            <Text style={styles.languageButtonText}>
              {language ===
              'en'
                ? 'සිංහල'
                : 'English'}
            </Text>

          </TouchableOpacity>

        </View>

        {/* DISCLAIMER */}

        {/* AI Medical Safety Notice */}
        <View style={styles.disclaimerCard}>

          <View style={styles.disclaimerIcon}>

            <AlertTriangle
              size={17}
              color={COLORS.amber}
            />

          </View>

          <View style={styles.disclaimerContent}>

            <Text style={styles.disclaimerTitle}>
              AI-generated, not a medical diagnosis
            </Text>

            <Text style={styles.disclaimerText}>
              This assistant does not diagnose or prescribe. Always consult a verified healthcare professional for medical advice or urgent concerns.
            </Text>

          </View>

        </View>

        {/* CHAT */}

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollViewRef
              .current
              ?.scrollToEnd({
                animated:
                  true,
              })
          }
        >

          {messages.map(
            (
              message,
              index
            ) => {
              const isUser =
                message.role ===
                'user';

              return (
                <View
                  key={`${message.role}-${index}`}
                  style={[
                    styles.messageRow,

                    isUser
                      ? styles.userMessageRow
                      : styles.aiMessageRow,
                  ]}
                >

                  {!isUser ? (
                    <View style={styles.aiAvatar}>

                      <Bot
                        size={16}
                        color={COLORS.teal}
                      />

                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.messageBubble,

                      isUser
                        ? styles.userBubble
                        : styles.aiBubble,
                    ]}
                  >

                    {!isUser ? (
                      <Text style={styles.messageAuthor}>
                        Care4U Assistant
                      </Text>
                    ) : null}

                    {isUser ? (
                      <Text style={styles.userText}>
                        {message.content}
                      </Text>
                    ) : (
                      /* AI Reply Markdown Display */ <Markdown
                        style={
                          markdownStyles
                        }
                      >
                        {message.content}
                      </Markdown>
                    )}

                  </View>

                  {isUser ? (
                    <View style={styles.userAvatar}>

                      <UserRound
                        size={15}
                        color="#FFFFFF"
                      />

                    </View>
                  ) : null}

                </View>
              );
            }
          )}

          {/* QUICK PROMPTS */}

          {messages.length ===
            1 &&
          !loading ? (
            <View style={styles.quickPromptSection}>

              <Text style={styles.quickPromptLabel}>
                SUGGESTED QUESTIONS
              </Text>

              <View style={styles.quickPromptList}>

                {QUICK_PROMPTS[
                  language
                ].map(
                  prompt => (
                    /* Suggested AI Question Button */ <TouchableOpacity
                      key={prompt}
                      style={styles.quickPrompt}
                      activeOpacity={0.75}
                      onPress={() =>
                        sendMessage(
                          prompt
                        )
                      }
                    >

                      <Sparkles
                        size={13}
                        color={COLORS.teal}
                      />

                      <Text style={styles.quickPromptText}>
                        {prompt}
                      </Text>

                    </TouchableOpacity>
                  )
                )}

              </View>

            </View>
          ) : null}

          {/* THINKING */}

          {loading ? (
            <View
              style={[
                styles.messageRow,
                styles.aiMessageRow,
              ]}
            >

              <View style={styles.aiAvatar}>

                <Bot
                  size={16}
                  color={COLORS.teal}
                />

              </View>

              <View
                style={[
                  styles.messageBubble,
                  styles.aiBubble,
                  styles.loadingBubble,
                ]}
              >

                <ActivityIndicator
                  size="small"
                  color={COLORS.teal}
                />

                <Text style={styles.thinkingText}>
                  Care4U is thinking…
                </Text>

              </View>

            </View>
          ) : null}

        </ScrollView>

        {/* INPUT */}

        <View style={styles.composerArea}>

          <View style={styles.composer}>

            <TextInput
              style={styles.textInput}
              placeholder={
                language ===
                'en'
                  ? 'Ask Care4U anything...'
                  : 'Care4U වෙතින් අසන්න...'
              }
              placeholderTextColor={COLORS.subtle}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!loading}
            />

            {/* Send AI Chat Message Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,

                (
                  !inputText.trim() ||
                  loading
                ) &&
                  styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={() =>
                sendMessage()
              }
              disabled={
                !inputText.trim() ||
                loading
              }
            >

              <Send
                size={18}
                color="#FFFFFF"
              />

            </TouchableOpacity>

          </View>

          <View style={styles.composerFooter}>

            <View style={styles.secureRow}>

              <ShieldCheck
                size={12}
                color={COLORS.subtle}
              />

              <Text style={styles.secureText}>
                Care4U patient assistant
              </Text>

            </View>

            <Text style={styles.characterCount}>
              {inputText.length}/500
            </Text>

          </View>

        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

/* STYLES */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    /* ASSISTANT INTRO */

    assistantCard: {
      flexDirection: 'row',

      alignItems: 'center',

      marginHorizontal: 16,

      marginTop: 14,

      marginBottom: 10,

      padding: 13,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.04,

      shadowRadius: 10,

      elevation: 1,
    },

    assistantIcon: {
      width: 42,

      height: 42,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginRight: 10,
    },

    assistantContent: {
      flex: 1,

      minWidth: 0,
    },

    assistantEyebrow: {
      color:
        COLORS.teal,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.8,
    },

    assistantTitle: {
      color:
        COLORS.navy,

      fontSize: 14,

      fontWeight: '800',

      marginTop: 2,
    },

    assistantDescription: {
      color:
        COLORS.muted,

      fontSize: 8,

      lineHeight: 12,

      marginTop: 2,
    },

    languageButton: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      borderRadius: 12,

      backgroundColor:
        COLORS.tealSoft,

      paddingHorizontal: 10,

      paddingVertical: 8,

      marginLeft: 8,
    },

    languageButtonText: {
      color:
        COLORS.tealDark,

      fontSize: 9,

      fontWeight: '800',
    },

    /* DISCLAIMER */

    disclaimerCard: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 9,

      marginHorizontal: 16,

      marginBottom: 4,

      padding: 11,

      borderRadius: 15,

      borderWidth: 1,

      borderColor:
        '#F3DFAB',

      backgroundColor:
        COLORS.amberSoft,
    },

    disclaimerIcon: {
      width: 32,

      height: 32,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      flexShrink: 0,
    },

    disclaimerContent: {
      flex: 1,
    },

    disclaimerTitle: {
      color:
        '#8A5A13',

      fontSize: 9,

      fontWeight: '800',
    },

    disclaimerText: {
      color:
        '#8A641F',

      fontSize: 8,

      lineHeight: 13,

      marginTop: 3,
    },

    /* CHAT */

    chatArea: {
      flex: 1,
    },

    chatContent: {
      paddingHorizontal: 16,

      paddingTop: 14,

      paddingBottom: 18,
    },

    messageRow: {
      width: '100%',

      flexDirection: 'row',

      alignItems:
        'flex-end',

      marginBottom: 14,
    },

    aiMessageRow: {
      justifyContent:
        'flex-start',
    },

    userMessageRow: {
      justifyContent:
        'flex-end',
    },

    aiAvatar: {
      width: 30,

      height: 30,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginRight: 7,

      marginBottom: 2,
    },

    userAvatar: {
      width: 30,

      height: 30,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.navy,

      marginLeft: 7,

      marginBottom: 2,
    },

    messageBubble: {
      maxWidth: '88%',

      paddingHorizontal: 13,

      paddingVertical: 11,

      borderRadius: 17,
    },

    aiBubble: {
      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderBottomLeftRadius: 5,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.025,

      shadowRadius: 5,

      elevation: 1,
    },

    userBubble: {
      backgroundColor:
        COLORS.navy,

      borderBottomRightRadius: 5,
    },

    messageAuthor: {
      color:
        COLORS.teal,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.4,

      textTransform:
        'uppercase',

      marginBottom: 5,
    },

    userText: {
      color:
        '#FFFFFF',

      fontSize: 13,

      lineHeight: 19,
    },

    loadingBubble: {
      minWidth: 130,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,
    },

    thinkingText: {
      color:
        COLORS.muted,

      fontSize: 9,

      fontWeight: '600',
    },

    /* QUICK PROMPTS */

    quickPromptSection: {
      marginTop: 3,

      marginBottom: 8,

      paddingLeft: 37,
    },

    quickPromptLabel: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.8,

      marginBottom: 8,
    },

    quickPromptList: {
      gap: 7,
    },

    quickPrompt: {
      alignSelf:
        'flex-start',

      maxWidth: '92%',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        '#DCEBE9',

      backgroundColor:
        COLORS.tealSoft,

      paddingHorizontal: 11,

      paddingVertical: 9,
    },

    quickPromptText: {
      flexShrink: 1,

      color:
        COLORS.tealDark,

      fontSize: 9,

      lineHeight: 13,

      fontWeight: '700',
    },

    /* COMPOSER */

    composerArea: {
      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      paddingHorizontal: 12,

      paddingTop: 10,

      paddingBottom:
        Platform.OS ===
        'ios'
          ? 8
          : 10,
    },

    composer: {
      flexDirection: 'row',

      alignItems:
        'flex-end',

      gap: 8,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 18,

      backgroundColor:
        '#F8FAFB',

      paddingLeft: 13,

      paddingRight: 6,

      paddingVertical: 6,
    },

    textInput: {
      flex: 1,

      minHeight: 39,

      maxHeight: 100,

      color:
        COLORS.text,

      fontSize: 12,

      lineHeight: 18,

      paddingTop: 9,

      paddingBottom: 8,

      paddingRight: 4,
    },

    sendButton: {
      width: 40,

      height: 40,

      borderRadius: 13,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.teal,
    },

    sendButtonDisabled: {
      backgroundColor:
        '#B7C4CA',
    },

    composerFooter: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingHorizontal: 4,

      paddingTop: 6,
    },

    secureRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,
    },

    secureText: {
      color:
        COLORS.subtle,

      fontSize: 7,
    },

    characterCount: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '600',
    },
  });

/* MARKDOWN STYLES */

const markdownStyles =
  StyleSheet.create({
    body: {
      color:
        COLORS.textSoft,

      fontSize: 12,

      lineHeight: 19,

      marginTop: 0,

      marginBottom: 0,
    },

    paragraph: {
      marginTop: 0,

      marginBottom: 7,
    },

    strong: {
      color:
        COLORS.text,

      fontWeight: '800',
    },

    em: {
      color:
        COLORS.textSoft,

      fontStyle: 'italic',
    },

    heading1: {
      color:
        COLORS.navy,

      fontSize: 15,

      fontWeight: '800',

      marginTop: 6,

      marginBottom: 6,
    },

    heading2: {
      color:
        COLORS.navy,

      fontSize: 14,

      fontWeight: '800',

      marginTop: 6,

      marginBottom: 5,
    },

    heading3: {
      color:
        COLORS.navy,

      fontSize: 13,

      fontWeight: '800',

      marginTop: 5,

      marginBottom: 4,
    },

    bullet_list: {
      marginTop: 3,

      marginBottom: 6,
    },

    ordered_list: {
      marginTop: 3,

      marginBottom: 6,
    },

    list_item: {
      marginBottom: 3,
    },

    table: {
      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 8,

      marginTop: 8,

      marginBottom: 8,
    },

    th: {
      backgroundColor:
        '#F1F5F9',

      padding: 7,

      color:
        COLORS.text,

      fontWeight: '800',
    },

    td: {
      padding: 7,

      color:
        COLORS.textSoft,

      borderColor:
        COLORS.border,
    },

    link: {
      color:
        COLORS.teal,

      textDecorationLine:
        'underline',
    },

    code_inline: {
      color:
        COLORS.navy,

      backgroundColor:
        COLORS.navySoft,

      borderRadius: 4,

      paddingHorizontal: 4,
    },
  });

export default AIChatScreen;