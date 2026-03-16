import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Layout from '../Dogpuppyhousebonecmpnts/Layout';
import { STORIES, StoryId } from '../Dogpuppyhouseboncnsts/stories';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AnimatedPressable from '../Dogpuppyhousebonecmpnts/AnimatedPressable';

const { width: W, height: H } = Dimensions.get('window');
const isLandscape = W > H;
const s = isLandscape ? W / 844 : Math.min(W / 390, H / 844);
const STORAGE_STORY_FAVORITES = 'STORY_FAVORITES';

type RouteParams = {
  storyId: StoryId;
};

const StoryDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params as RouteParams | undefined;

  const story = useMemo(() => {
    const byId = STORIES.find(v => v.id === params?.storyId);
    return byId ?? STORIES[0];
  }, [params?.storyId]);
  const [isFavorite, setIsFavorite] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const coverAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;

  const loadFavoriteState = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_STORY_FAVORITES);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setIsFavorite(Array.isArray(parsed) ? parsed.includes(story.id) : false);
    } catch {
      setIsFavorite(false);
    }
  }, [story.id]);

  const runEntrance = useCallback(() => {
    [headerAnim, coverAnim, bodyAnim].forEach(v => v.setValue(0));
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(coverAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bodyAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bodyAnim, coverAnim, headerAnim]);

  useFocusEffect(
    useCallback(() => {
      loadFavoriteState();
      runEntrance();
    }, [loadFavoriteState, runEntrance]),
  );

  const onShare = () => {
    Share.share({
      message: `${story.title}\n\n${story.text}`,
    });
  };

  const onToggleFavorite = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_STORY_FAVORITES);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      const arr = Array.isArray(parsed) ? parsed : [];
      const next = arr.includes(story.id)
        ? arr.filter(v => v !== story.id)
        : [...arr, story.id];
      await AsyncStorage.setItem(STORAGE_STORY_FAVORITES, JSON.stringify(next));
      setIsFavorite(next.includes(story.id));
    } catch {}
  }, [story.id]);

  return (
    <Layout>
      <View style={styles.screen}>
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <ImageBackground
            source={require('../assets/images/smallHead.png')}
            style={styles.header}
            resizeMode="stretch"
          >
            <Text style={styles.headerText}>Stories</Text>
          </ImageBackground>
        </Animated.View>

        <Animated.View
          style={{
            opacity: coverAnim,
            transform: [
              {
                translateY: coverAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <Image source={story.image} style={styles.cover} resizeMode="cover" />
        </Animated.View>

        <Animated.View
          style={{
            opacity: bodyAnim,
            transform: [
              {
                translateY: bodyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={['#EB924D', '#963B34']}
            style={{
              borderWidth: 1,
              borderColor: '#59173E',
              borderRadius: 18,
              marginTop: 10,
            }}
          >
            <View style={styles.bodyCard}>
            <Text style={styles.title}>{story.title}</Text>
            <Text style={styles.body}>{story.text}</Text>

            <View style={styles.actions}>
              <AnimatedPressable
                activeOpacity={0.85}
                onPress={() => navigation.goBack()}
              >
                <ImageBackground
                  source={require('../assets/images/smallButton.png')}
                  style={styles.sideBtn}
                  resizeMode="stretch"
                >
                  <Image source={require('../assets/images/back.png')} />
                </ImageBackground>
              </AnimatedPressable>

              <AnimatedPressable
                activeOpacity={0.85}
                onPress={onShare}
                style={{ alignSelf: 'center' }}
              >
                <ImageBackground
                  source={require('../assets/images/mainbutton.png')}
                  style={styles.shareBtn}
                  resizeMode="stretch"
                >
                  <Text style={styles.shareText}>Share</Text>
                </ImageBackground>
              </AnimatedPressable>

              <AnimatedPressable
                activeOpacity={0.85}
                onPress={onToggleFavorite}
              >
                <ImageBackground
                  source={require('../assets/images/smallButton.png')}
                  style={styles.sideBtn}
                  resizeMode="stretch"
                >
                  {isFavorite ? (
                    <Image
                      source={require('../assets/images/favsfi.png')}
                      style={{ bottom: 2 }}
                    />
                  ) : (
                    <Image
                      source={require('../assets/images/favs.png')}
                      style={{ bottom: 2 }}
                    />
                  )}
                </ImageBackground>
              </AnimatedPressable>
            </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 50 * s,
    paddingBottom: 20 * s,
    paddingHorizontal: 12 * s,
  },
  header: {
    alignSelf: 'center',
    width: 284 * s,
    height: 102 * s,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8 * s,
  },
  headerText: {
    fontSize: 26 * s,
    color: '#1b0d05',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -11 * s,
  },
  cover: {
    width: '100%',
    height: 188 * s,
    borderWidth: 2,
    borderColor: '#59173E',
    borderRadius: 18 * s,
  },
  bodyCard: {
    paddingHorizontal: 14 * s,
    paddingVertical: 10 * s,
  },
  title: {
    color: '#59173E',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 6 * s,
  },
  body: {
    color: '#fff',
    fontFamily: 'Kanit-Regular',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  actions: {
    marginTop: 10 * s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 13 * s,
  },
  sideBtn: {
    width: 63 * s,
    height: 63 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtnText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 34 * s * 0.6,
    marginTop: -3 * s,
  },
  shareBtn: {
    height: 62 * s,
    justifyContent: 'center',
    alignItems: 'center',
    width: 170,
    alignSelf: 'center',
  },
  shareText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 22 * s,
    marginTop: -2 * s,
  },
});

export default StoryDetailsScreen;
