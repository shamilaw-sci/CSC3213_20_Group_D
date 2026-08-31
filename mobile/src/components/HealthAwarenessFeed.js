/**
 * @file    HealthAwarenessFeed.js
 * @module  Patient
 * @desc    Mobile widget that displays personalized health articles based on patient conditions/allergies.
 *          Includes deduplication to prevent duplicate articles from rendering.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';

const HealthAwarenessFeed = ({ patientAllergies = [] }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndFilterContent = async () => {
      try {
        setLoading(true);
        // Fetch from the backend
        const response = await api.get('/api/admin/health-content?status=published');
        const data = response.data.data || [];

        // Make the UI bulletproof: Remove duplicates based on the article title
        const uniqueData = Array.from(new Map(data.map(item => [item.title, item])).values());

        // Run the Smart Filter logic locally for mobile
        let personalized = uniqueData;
        if (patientAllergies.length > 0 && uniqueData.length > 0) {
          const allergyKeywords = patientAllergies.map(a => a.allergen?.toLowerCase() || '');
          
          personalized = [...uniqueData].sort((a, b) => {
            const aText = `${a.title} ${a.category} ${a.body}`.toLowerCase();
            const bText = `${b.title} ${b.category} ${b.body}`.toLowerCase();

            const aMatches = allergyKeywords.some(keyword => aText.includes(keyword)) ? 1 : 0;
            const bMatches = allergyKeywords.some(keyword => bText.includes(keyword)) ? 1 : 0;

            return bMatches - aMatches;
          });
        }

        setArticles(personalized);
      } catch (err) {
        console.error('Mobile Feed Error:', err);
        setError('Failed to load feed.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterContent();
  }, [patientAllergies]);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Recommended For You</Text>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#2E75B6" />
          <Text style={styles.loadingText}>Loading personalized feed...</Text>
        </View>
      </View>
    );
  }

  if (error || articles.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Recommended Health Tips</Text>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No new health tips at the moment. Check back later!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recommended For You</Text>
      <View style={styles.listContainer}>
        {articles.slice(0, 3).map((article, index) => (
          <View key={index} style={styles.articleItem}>
            <View style={styles.accentLine} />
            <View style={styles.articleContent}>
              <Text style={styles.articleTitle} numberOfLines={1}>{article.title}</Text>
              <Text style={styles.articleBody} numberOfLines={2}>{article.body}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{article.category || 'Health Tip'}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  centerContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  articleItem: {
    flexDirection: 'row',
  },
  accentLine: {
    width: 4,
    backgroundColor: '#0D9488', // Teal-600
    borderRadius: 2,
    marginRight: 12,
  },
  articleContent: {
    flex: 1,
    paddingVertical: 2,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  articleBody: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDFA', // Teal-50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F766E', // Teal-700
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default HealthAwarenessFeed;