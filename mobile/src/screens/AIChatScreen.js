/**
 * @file    AIChatScreen.js
 * @module  Patient
 * @desc    Mobile AI Chat Assistant screen for patients. Includes a persistent
 *          disclaimer, language toggle, Markdown rendering, and strict keyboard
 *          avoidance logic.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import api from '../services/api';
import useAuthStore from '../store/authStore'; // Wire in mobile Zustand

/**
 * @component AIChatScreen
 * @desc      Renders the AI chat interface for the patient mobile app.
 */
const AIChatScreen = () => {
  const user = useAuthStore((state) => state.user);
  const patientId = user?.profile_id || user?.id || '';

  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am the Care4U AI Assistant. How can I help you navigate the app or provide basic first-aid information today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en'); 
  const scrollViewRef = useRef();

  /**
   * Sends the user's message to the backend LLM API and updates the chat.
   */
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Capture the current history before we add the new message to state
    const currentHistory = [...messages];
    
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post(`/api/patients/${patientId}/chat`, {
        message: userMessage,
        language: language === 'en' ? 'English' : 'Sinhala',
        history: currentHistory // <-- Sending the context here!
      });

      if (response.data.success) {
        setMessages((prev) => [...prev, { role: 'ai', content: response.data.data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [...prev, { role: 'ai', content: 'Network error. Please check your connection and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles the preferred language for the AI prompt.
   */
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'si' : 'en'));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >
      {/* Persistent Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          ⚠️ AI-generated information. This assistant does not diagnose or prescribe. Always consult a verified doctor for medical advice.
        </Text>
      </View>

      {/* Header Controls */}
      <View style={styles.controlsHeader}>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
          <Text style={styles.langButtonText}>
            {language === 'en' ? 'Switch to Sinhala' : 'Switch to English'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat History Area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <View 
            key={index} 
            style={[
              styles.messageBubble, 
              msg.role === 'user' ? styles.userBubble : styles.aiBubble
            ]}
          >
            {msg.role === 'user' ? (
              <Text style={styles.userText}>{msg.content}</Text>
            ) : (
              <Markdown style={markdownStyles}>
                {msg.content}
              </Markdown>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#006B6B" />
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={handleSendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  disclaimerBanner: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  disclaimerText: {
    color: '#92400E',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  langButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
  },
  langButtonText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 15,
    gap: 10,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E3A5F',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingBubble: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#1E293B',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#006B6B',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

// Styles specifically targeted at the Markdown elements inside the AI bubble
const markdownStyles = StyleSheet.create({
  body: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
  },
  strong: {
    fontWeight: '700',
    color: '#1E293B',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  th: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    fontWeight: '700',
  },
  td: {
    padding: 8,
    borderColor: '#E2E8F0',
  },
});

export default AIChatScreen;