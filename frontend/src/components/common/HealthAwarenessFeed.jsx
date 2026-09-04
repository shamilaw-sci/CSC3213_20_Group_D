/**
 * @file    HealthAwarenessFeed.jsx
 * @module  Patient
 * @desc    Widget that displays personalized health articles based on patient conditions/allergies.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import React, { useEffect, useState } from 'react';
import { getHealthContent, getPersonalizedFeed } from '../../services/healthContentService';
import { Info } from 'lucide-react';
import Badge from './Badge';

const HealthAwarenessFeed = ({ patientAllergies = [] }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        // Fetch from Member 1's backend endpoint
        const data = await getHealthContent();
        
        // Pass it through our smart filter logic (Epic 8.13 requirement)
        const personalized = getPersonalizedFeed(data, patientAllergies);
        setArticles(personalized);
      } catch {
        setError('Failed to load health feed.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [patientAllergies]);

  if (loading) {
    return (
      <div className="bg-background rounded-xl shadow-sm border border-border p-5">
        <h3 className="text-lg font-bold text-foreground mb-4">Recommended Health Tips</h3>
        <div className="flex justify-center items-center h-24">
          <span className="text-muted-foreground text-sm animate-pulse">Loading personalized feed...</span>
        </div>
      </div>
    );
  }

  if (error || articles.length === 0) {
    return (
      <div className="bg-background rounded-xl shadow-sm border border-border p-5">
        <h3 className="text-lg font-bold text-foreground mb-4">Recommended Health Tips</h3>
        <div className="flex flex-col items-center justify-center h-24 text-center">
          <Info className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">No new health tips at the moment. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border p-5">
      <h3 className="text-lg font-bold text-foreground mb-4">Recommended For You</h3>
      <div className="space-y-4">
        {articles.slice(0, 3).map((article, index) => (
          <div key={index} className="border-l-4 border-primary pl-4 py-1">
            <h4 className="text-sm font-bold text-foreground">{article.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {article.body}
            </p>
            <div className="mt-2">
              <Badge status="normal" label={article.category || 'Health Tip'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthAwarenessFeed;