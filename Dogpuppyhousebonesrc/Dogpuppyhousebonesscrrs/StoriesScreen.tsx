// stories

import { STORIES, StoryId } from '../Dogpuppyhouseboncnsts/stories';

import LinearGradient from 'react-native-linear-gradient';

import AnimatedPressable from '../Dogpuppyhousebonecmpnts/AnimatedPressable';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Layout from '../Dogpuppyhousebonecmpnts/Layout';

const { width: W, height: H } = Dimensions.get('window');
const puppyBoneIsLandscape = W > H;
const puppyBoneS = puppyBoneIsLandscape ? W / 844 : Math.min(W / 390, H / 844);
const puppyBoneStorageStoryFavorites = 'STORY_FAVORITES';

const StoriesScreen: React.FC = () => {
  const puppyBoneNavigation = useNavigation<any>();
  const [puppyBoneFavoriteIds, setPuppyBoneFavoriteIds] = useState<StoryId[]>(
    [],
  );
  const puppyBoneCardAnimations = useRef(
    STORIES.map(() => new Animated.Value(0)),
  ).current;

  const puppyBoneLoadFavorites = useCallback(async () => {
    try {
      const puppyBoneSaved = await AsyncStorage.getItem(
        puppyBoneStorageStoryFavorites,
      );
      const puppyBoneParsed = puppyBoneSaved
        ? (JSON.parse(puppyBoneSaved) as string[])
        : [];
      const puppyBoneValidIds = STORIES.map(v => v.id);
      const puppyBoneNext = Array.isArray(puppyBoneParsed)
        ? (puppyBoneParsed.filter(id =>
            puppyBoneValidIds.includes(id as StoryId),
          ) as StoryId[])
        : [];
      setPuppyBoneFavoriteIds(puppyBoneNext);
    } catch {
      setPuppyBoneFavoriteIds([]);
    }
  }, []);

  const puppyBoneRunCardsEntrance = useCallback(() => {
    puppyBoneCardAnimations.forEach(v => v.setValue(0));
    Animated.stagger(
      130,
      puppyBoneCardAnimations.map(v =>
        Animated.timing(v, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [puppyBoneCardAnimations]);

  useFocusEffect(
    useCallback(() => {
      puppyBoneLoadFavorites();
      puppyBoneRunCardsEntrance();
    }, [puppyBoneLoadFavorites, puppyBoneRunCardsEntrance]),
  );

  const puppyBoneFavoriteSet = useMemo(
    () => new Set(puppyBoneFavoriteIds),
    [puppyBoneFavoriteIds],
  );

  return (
    <Layout>
      <View style={styles.puppyBoneScreen}>
        <ImageBackground
          source={require('../assets/images/smallHead.png')}
          style={styles.puppyBoneHeader}
          resizeMode="stretch"
        >
          <Text style={styles.puppyBoneHeaderText}>Stories</Text>
        </ImageBackground>

        <View style={styles.puppyBoneList}>
          {STORIES.map((item, index) => (
            <Animated.View
              key={item.id}
              style={{
                opacity: puppyBoneCardAnimations[index],
                transform: [
                  {
                    translateY: puppyBoneCardAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={['#EB924D', '#963B34']}
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#59173E',
                }}
              >
                <View
                  style={{
                    padding: 6,
                    flexDirection: 'row',
                  }}
                >
                  <Image
                    source={item.image}
                    style={styles.puppyBoneCardImage}
                  />

                  <View style={styles.puppyBoneCardContent}>
                    <Text style={styles.puppyBoneCardTitle}>{item.title}</Text>
                    <Text style={styles.puppyBoneCardBody} numberOfLines={3}>
                      {item.text}
                    </Text>

                    <View style={styles.puppyBoneActionsRow}>
                      <AnimatedPressable
                        activeOpacity={0.85}
                        onPress={() =>
                          puppyBoneNavigation.navigate('StoryDetailsScreen', {
                            storyId: item.id,
                          })
                        }
                        style={styles.puppyBoneMoreWrap}
                      >
                        <ImageBackground
                          source={require('../assets/images/morebt.png')}
                          style={styles.puppyBoneMoreBtn}
                          resizeMode="stretch"
                        >
                          <Text style={styles.puppyBoneMoreText}>More</Text>
                        </ImageBackground>
                      </AnimatedPressable>

                      {puppyBoneFavoriteSet.has(item.id) ? (
                        <ImageBackground
                          source={require('../assets/images/liked.png')}
                          style={styles.puppyBoneLikeBtn}
                          resizeMode="stretch"
                        >
                          <Image
                            source={require('../assets/images/herartl.png')}
                            style={{ bottom: 2 }}
                          />
                        </ImageBackground>
                      ) : null}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  puppyBoneScreen: {
    flex: 1,
    paddingTop: 50 * puppyBoneS,
    paddingBottom: 120,
    paddingHorizontal: 14 * puppyBoneS,
  },
  puppyBoneHeader: {
    alignSelf: 'center',
    width: 284 * puppyBoneS,
    height: 102 * puppyBoneS,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10 * puppyBoneS,
  },
  puppyBoneHeaderText: {
    fontSize: 26 * puppyBoneS,
    color: '#1b0d05',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -11 * puppyBoneS,
  },
  puppyBoneList: {
    gap: 10 * puppyBoneS,
  },
  puppyBoneCard: {
    minHeight: 150 * puppyBoneS,
    borderRadius: 18 * puppyBoneS,
    flexDirection: 'row',
    padding: 6 * puppyBoneS,
    overflow: 'hidden',
  },
  puppyBoneCardImage: {
    width: 145 * puppyBoneS,
    borderRadius: 12 * puppyBoneS,
    height: 148,
  },
  puppyBoneCardContent: {
    flex: 1,
    marginLeft: 8 * puppyBoneS,
    justifyContent: 'space-between',
  },
  puppyBoneCardTitle: {
    color: '#59173E',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 22,
  },
  puppyBoneCardBody: {
    color: '#fff',
    fontFamily: 'Kanit-Regular',
    fontSize: 14,
  },
  puppyBoneMoreWrap: {
    alignSelf: 'flex-start',
    marginTop: 3,
    marginBottom: 2 * puppyBoneS,
  },
  puppyBoneActionsRow: {
    marginTop: 6 * puppyBoneS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  puppyBoneMoreBtn: {
    width: 112 * puppyBoneS,
    height: 41,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppyBoneLikeBtn: {
    width: 41,
    height: 41,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  puppyBoneLikeText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 18,
    marginTop: -2 * puppyBoneS,
  },
  puppyBoneMoreText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 17,
    marginTop: -1 * puppyBoneS,
  },
});

export default StoriesScreen;
