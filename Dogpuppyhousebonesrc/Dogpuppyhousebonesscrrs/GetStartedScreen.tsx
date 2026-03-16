//    onboard

import AnimatedPressable from '../Dogpuppyhousebonecmpnts/AnimatedPressable';

import { SLIDES } from '../Dogpuppyhouseboncnsts/slides';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Layout from '../Dogpuppyhousebonecmpnts/Layout';

const GetStartedScreen: React.FC = () => {
  const [slideNumber, setSlideNumber] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation<any>();

  const slide = useMemo(() => SLIDES[slideNumber], [slideNumber]);

  const nextScreen = useCallback(() => {
    setSlideNumber(prev => {
      if (prev < SLIDES.length - 1) return prev + 1;
      navigation.replace('Tabroutes');
      return prev;
    });
  }, [navigation]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideNumber]);

  return (
    <Layout>
      <View style={styles.maincontainer}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <ImageBackground
            source={require('../assets/images/headerframe.png')}
            style={styles.headerFrame}
            resizeMode="stretch"
          >
            <Text style={styles.headerText}>{slide.title}</Text>
          </ImageBackground>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Image source={slide.image} style={styles.slideImage} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <ImageBackground
            source={require('../assets/images/textboard.png')}
            style={styles.textBoard}
            resizeMode="stretch"
          >
            <View style={styles.textPad}>
              <Text style={styles.boardText}>{slide.text}</Text>
            </View>
          </ImageBackground>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <AnimatedPressable activeOpacity={0.8} onPress={nextScreen}>
            <ImageBackground
              source={require('../assets/images/mainbutton.png')}
              style={styles.buttonBoard}
              resizeMode="stretch"
            >
              <Text style={styles.buttonText}>{slide.button}</Text>
            </ImageBackground>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </Layout>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerFrame: {
    width: 314,
    height: 113,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    marginTop: 30,
  },
  textBoard: {
    width: 287,
    height: 211,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPad: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  buttonBoard: {
    width: 218,
    height: 79,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Kanit-SemiBold',
    bottom: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  boardText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Kanit-Regular',
  },
  buttonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Kanit-SemiBold',
  },
});
