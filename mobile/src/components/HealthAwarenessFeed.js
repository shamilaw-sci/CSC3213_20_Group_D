/**
 * @file    HealthAwarenessFeed.js
 * @module  Patient
 * @desc    Mobile personalized health-awareness infographic carousel.
 *          Displays published Care4U infographic articles, prioritizes
 *          allergy-relevant content, supports swipe navigation,
 *          manual controls, and automatic rotation.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import {
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Info,
  Pause,
  Play,
} from 'lucide-react-native';

import api from '../services/api';

const AUTO_SCROLL_DELAY =
  15000;

const SWIPE_THRESHOLD =
  45;

const COLORS = {
  surface: '#FFFFFF',
  background: '#F8FAFC',
  secondary: '#F1F5F9',

  border: '#E2E8F0',

  text: '#0F172A',
  muted: '#64748B',
  subtle: '#94A3B8',

  primary: '#0F766E',
  primaryDark: '#115E59',
  primarySoft: '#CCFBF1',

  overlay:
    'rgba(15, 23, 42, 0.58)',
};

/**
 * Converts a health-content image URL into a URI that
 * React Native can load.
 *
 * Absolute URLs are returned unchanged.
 * Relative backend URLs are joined with the configured
 * API base URL.
 *
 * @param {string} imageUrl
 * @returns {string}
 */
const resolveImageUrl = (
  imageUrl
) => {
  if (!imageUrl) {
    return '';
  }

  if (
    imageUrl.startsWith(
      'http://'
    ) ||
    imageUrl.startsWith(
      'https://'
    ) ||
    imageUrl.startsWith(
      'data:'
    )
  ) {
    return imageUrl;
  }

  const baseUrl =
    api.defaults
      ?.baseURL ||
    '';

  if (!baseUrl) {
    return imageUrl;
  }

  const cleanBase =
    baseUrl.endsWith('/')
      ? baseUrl.slice(
          0,
          -1
        )
      : baseUrl;

  const cleanPath =
    imageUrl.startsWith('/')
      ? imageUrl
      : `/${imageUrl}`;

  return (
    `${cleanBase}${cleanPath}`
  );
};

/**
 * Removes duplicate content items using the article title.
 *
 * @param {Array} items
 * @returns {Array}
 */
const removeDuplicateArticles = (
  items
) => {
  return Array.from(
    new Map(
      items.map(
        (item) => [
          item.title,
          item,
        ]
      )
    ).values()
  );
};

/**
 * Prioritizes content containing one of the patient's
 * saved allergy keywords.
 *
 * @param {Array} items
 * @param {Array} patientAllergies
 * @returns {Array}
 */
const personalizeArticles = (
  items,
  patientAllergies
) => {
  if (
    !patientAllergies.length ||
    !items.length
  ) {
    return items;
  }

  const allergyKeywords =
    patientAllergies
      .map(
        (allergy) =>
          allergy
            ?.allergen
            ?.trim()
            ?.toLowerCase() ||
          ''
      )
      .filter(Boolean);

  return [
    ...items,
  ].sort(
    (
      first,
      second
    ) => {
      const firstText =
        `${
          first.title || ''
        } ${
          first.category ||
          ''
        } ${
          first.body || ''
        }`
          .toLowerCase();

      const secondText =
        `${
          second.title ||
          ''
        } ${
          second.category ||
          ''
        } ${
          second.body || ''
        }`
          .toLowerCase();

      const firstMatch =
        allergyKeywords.some(
          (keyword) =>
            firstText.includes(
              keyword
            )
        )
          ? 1
          : 0;

      const secondMatch =
        allergyKeywords.some(
          (keyword) =>
            secondText.includes(
              keyword
            )
        )
          ? 1
          : 0;

      return (
        secondMatch -
        firstMatch
      );
    }
  );
};

/**
 * @component HealthAwarenessFeed
 * @desc      Personalized mobile infographic carousel.
 *
 * @param {Array} patientAllergies
 */
const HealthAwarenessFeed = ({
  patientAllergies = [],
}) => {
  const {
    width:
      screenWidth,
    height:
      screenHeight,
  } =
    useWindowDimensions();

  const [
    articles,
    setArticles,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    isPaused,
    setIsPaused,
  ] = useState(false);

  const [
    imageRatios,
    setImageRatios,
  ] = useState({});

  const touchStartX =
    useRef(null);

  const resumeTimer =
    useRef(null);

  /**
   * Loads published health content and keeps only
   * complete infographic articles.
   */
  useEffect(() => {
    const fetchContent =
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            null
          );

          const response =
            await api.get(
              '/api/admin/health-content?status=published'
            );

          const data =
            response
              .data
              .data ||
            [];

          const uniqueData =
            removeDuplicateArticles(
              data
            );

          const personalized =
            personalizeArticles(
              uniqueData,
              patientAllergies
            );

          /**
           * Match the finished web feed:
           * patients see infographic articles only.
           */
          const infographicArticles =
            personalized.filter(
              (article) =>
                Boolean(
                  article
                    .image_url
                )
            );

          setArticles(
            infographicArticles
          );

          setCurrentIndex(
            0
          );

        } catch (
          requestError
        ) {
          console.error(
            'Mobile health feed error:',
            requestError
          );

          setError(
            'Failed to load health infographics.'
          );

        } finally {
          setLoading(
            false
          );
        }
      };

    fetchContent();

  }, [
    patientAllergies,
  ]);

  /**
   * Automatic carousel rotation.
   */
  useEffect(() => {
    if (
      articles.length <= 1 ||
      isPaused
    ) {
      return undefined;
    }

    const interval =
      setInterval(
        () => {
          setCurrentIndex(
            (
              previousIndex
            ) =>
              (
                previousIndex +
                1
              ) %
              articles.length
          );
        },
        AUTO_SCROLL_DELAY
      );

    return () =>
      clearInterval(
        interval
      );

  }, [
    articles.length,
    isPaused,
  ]);

  /**
   * Clears delayed resume work when the
   * component unmounts.
   */
  useEffect(() => {
    return () => {
      if (
        resumeTimer
          .current
      ) {
        clearTimeout(
          resumeTimer
            .current
        );
      }
    };
  }, []);

  /**
   * Moves to the previous infographic.
   */
  const goToPrevious =
    () => {
      if (
        articles.length ===
        0
      ) {
        return;
      }

      setCurrentIndex(
        (
          previousIndex
        ) =>
          (
            previousIndex -
            1 +
            articles.length
          ) %
          articles.length
      );
    };

  /**
   * Moves to the next infographic.
   */
  const goToNext =
    () => {
      if (
        articles.length ===
        0
      ) {
        return;
      }

      setCurrentIndex(
        (
          previousIndex
        ) =>
          (
            previousIndex +
            1
          ) %
          articles.length
      );
    };

  /**
   * Temporarily pauses automatic rotation after
   * direct user interaction.
   */
  const pauseTemporarily =
    () => {
      setIsPaused(
        true
      );

      if (
        resumeTimer
          .current
      ) {
        clearTimeout(
          resumeTimer
            .current
        );
      }

      resumeTimer.current =
        setTimeout(
          () => {
            setIsPaused(
              false
            );
          },
          2500
        );
    };

  /**
   * Records the starting X position for swipe navigation.
   */
  const handleTouchStart =
    (
      event
    ) => {
      touchStartX.current =
        event
          .nativeEvent
          .pageX;

      setIsPaused(
        true
      );
    };

  /**
   * Detects swipe direction and changes the
   * currently displayed infographic.
   */
  const handleTouchEnd =
    (
      event
    ) => {
      if (
        touchStartX.current ===
        null
      ) {
        return;
      }

      const touchEndX =
        event
          .nativeEvent
          .pageX;

      const difference =
        touchStartX.current -
        touchEndX;

      if (
        Math.abs(
          difference
        ) >
        SWIPE_THRESHOLD
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

      pauseTemporarily();
    };

  /**
   * Stores the real aspect ratio of each loaded image
   * so portrait infographics remain readable instead of
   * being cropped.
   */
  const handleImageLoad =
    (
      articleKey,
      event
    ) => {
      const source =
        event
          .nativeEvent
          ?.source;

      if (
        !source?.width ||
        !source?.height
      ) {
        return;
      }

      setImageRatios(
        (
          previous
        ) => ({
          ...previous,

          [articleKey]:
            source.width /
            source.height,
        })
      );
    };

  if (loading) {
    return (
      <View style={styles.stateContainer}>

        <View style={styles.stateIcon}>
          <HeartPulse
            size={23}
            color={
              COLORS.primary
            }
          />
        </View>

        <ActivityIndicator
          size="small"
          color={
            COLORS.primary
          }
        />

        <Text style={styles.stateTitle}>
          Loading health infographics
        </Text>

        <Text style={styles.stateText}>
          Preparing personalized Care4U health content...
        </Text>

      </View>
    );
  }

  if (
    error ||
    articles.length ===
      0
  ) {
    return (
      <View style={styles.stateContainer}>

        <View style={styles.stateIcon}>
          <Info
            size={22}
            color={
              COLORS.muted
            }
          />
        </View>

        <Text style={styles.stateTitle}>
          No health infographics available
        </Text>

        <Text style={styles.stateText}>
          Check back later for new Care4U health-awareness content.
        </Text>

      </View>
    );
  }

  const currentArticle =
    articles[
      currentIndex
    ];

  const articleKey =
    currentArticle
      ?.id ||
    currentArticle
      ?.image_url ||
    currentIndex;

  const currentRatio =
    imageRatios[
      articleKey
    ] ||
    0.72;

  /**
   * Width available inside the parent dashboard card.
   */
  const availableWidth =
    Math.max(
      screenWidth -
        64,
      240
    );

  const maximumHeight =
    Math.min(
      screenHeight *
        0.68,
      560
    );

  const calculatedHeight =
    availableWidth /
    currentRatio;

  const imageHeight =
    Math.max(
      240,
      Math.min(
        calculatedHeight,
        maximumHeight
      )
    );

  return (
    <View>

      {/* ===================================================
          INFOGRAPHIC VIEWER
      ==================================================== */}

      <View
        style={styles.carousel}
        onTouchStart={
          handleTouchStart
        }
        onTouchEnd={
          handleTouchEnd
        }
      >

        <View style={styles.imageStage}>

          <Image
            key={
              currentArticle
                .image_url
            }
            source={{
              uri:
                resolveImageUrl(
                  currentArticle
                    .image_url
                ),
            }}
            accessibilityLabel={
              currentArticle
                .title ||
              'Care4U health infographic'
            }
            resizeMode="contain"
            onLoad={(
              event
            ) =>
              handleImageLoad(
                articleKey,
                event
              )
            }
            style={[
              styles.infographicImage,
              {
                height:
                  imageHeight,
              },
            ]}
          />

        </View>

        {articles.length >
          1 && (
          <>
            <TouchableOpacity
              style={[
                styles.arrowButton,
                styles.leftArrow,
              ]}
              activeOpacity={
                0.78
              }
              onPress={() => {
                goToPrevious();
                pauseTemporarily();
              }}
              accessibilityRole="button"
              accessibilityLabel="Previous health infographic"
            >
              <ChevronLeft
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.arrowButton,
                styles.rightArrow,
              ]}
              activeOpacity={
                0.78
              }
              onPress={() => {
                goToNext();
                pauseTemporarily();
              }}
              accessibilityRole="button"
              accessibilityLabel="Next health infographic"
            >
              <ChevronRight
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </>
        )}

      </View>

      {/* ===================================================
          CURRENT ARTICLE INFORMATION
      ==================================================== */}

      <View style={styles.articleInfo}>

        <View style={styles.articleText}>

          <Text
            style={styles.articleTitle}
            numberOfLines={2}
          >
            {
              currentArticle
                .title ||
              'Care4U Health Infographic'
            }
          </Text>

          <Text style={styles.articleCategory}>
            {
              currentArticle
                .category ||
              'Health Awareness'
            }
          </Text>

        </View>

        {articles.length >
          1 && (
          <TouchableOpacity
            style={styles.pauseButton}
            activeOpacity={
              0.75
            }
            onPress={() =>
              setIsPaused(
                (
                  previous
                ) =>
                  !previous
              )
            }
            accessibilityRole="button"
            accessibilityLabel={
              isPaused
                ? 'Resume automatic infographic rotation'
                : 'Pause automatic infographic rotation'
            }
          >
            {isPaused ? (
              <Play
                size={16}
                color={
                  COLORS.primary
                }
              />
            ) : (
              <Pause
                size={16}
                color={
                  COLORS.muted
                }
              />
            )}
          </TouchableOpacity>
        )}

      </View>

      {/* ===================================================
          CAROUSEL INDICATORS
      ==================================================== */}

      {articles.length >
        1 && (
        <View style={styles.carouselFooter}>

          <View style={styles.dots}>

            {articles.map(
              (
                article,
                index
              ) => {
                const active =
                  index ===
                  currentIndex;

                return (
                  <TouchableOpacity
                    key={
                      article.id ||
                      article
                        .image_url ||
                      index
                    }
                    activeOpacity={
                      0.75
                    }
                    onPress={() => {
                      setCurrentIndex(
                        index
                      );

                      pauseTemporarily();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Show health infographic ${
                      index +
                      1
                    }`}
                  >
                    <View
                      style={[
                        styles.dot,

                        active &&
                          styles.activeDot,
                      ]}
                    />
                  </TouchableOpacity>
                );
              }
            )}

          </View>

          <Text style={styles.counter}>
            {currentIndex + 1}
            {' of '}
            {articles.length}
            {'  •  '}
            15 sec
          </Text>

        </View>
      )}

    </View>
  );
};

const styles =
  StyleSheet.create({
    stateContainer: {
      minHeight: 230,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        24,

      backgroundColor:
        COLORS.secondary,
    },

    stateIcon: {
      width: 48,
      height: 48,

      borderRadius: 15,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.primarySoft,

      marginBottom: 13,
    },

    stateTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight:
        '800',

      textAlign:
        'center',

      marginTop: 10,
    },

    stateText: {
      color:
        COLORS.muted,

      fontSize: 11,

      lineHeight: 17,

      textAlign:
        'center',

      marginTop: 5,

      maxWidth: 270,
    },

    carousel: {
      position:
        'relative',

      overflow:
        'hidden',

      backgroundColor:
        COLORS.secondary,
    },

    imageStage: {
      width: '100%',

      padding: 8,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F8FAFC',
    },

    infographicImage: {
      width: '100%',

      borderRadius: 14,

      backgroundColor:
        COLORS.surface,
    },

    arrowButton: {
      position:
        'absolute',

      top: '46%',

      width: 38,
      height: 38,

      borderRadius: 19,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.overlay,
    },

    leftArrow: {
      left: 10,
    },

    rightArrow: {
      right: 10,
    },

    articleInfo: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,

      paddingTop: 13,

      paddingBottom: 10,

      backgroundColor:
        COLORS.surface,
    },

    articleText: {
      flex: 1,

      minWidth: 0,
    },

    articleTitle: {
      color:
        COLORS.text,

      fontSize: 13,

      lineHeight: 18,

      fontWeight:
        '800',
    },

    articleCategory: {
      color:
        COLORS.primary,

      fontSize: 9,

      fontWeight:
        '800',

      textTransform:
        'uppercase',

      letterSpacing:
        0.7,

      marginTop: 4,
    },

    pauseButton: {
      width: 36,
      height: 36,

      borderRadius: 12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.secondary,

      marginLeft: 10,
    },

    carouselFooter: {
      paddingHorizontal:
        14,

      paddingTop: 2,
      paddingBottom: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      backgroundColor:
        COLORS.surface,
    },

    dots: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,

      flex: 1,
    },

    dot: {
      width: 8,
      height: 8,

      borderRadius: 4,

      backgroundColor:
        COLORS.border,
    },

    activeDot: {
      width: 24,

      backgroundColor:
        COLORS.primary,
    },

    counter: {
      color:
        COLORS.subtle,

      fontSize: 9,

      fontWeight:
        '600',

      marginLeft: 12,
    },
  });

export default HealthAwarenessFeed;