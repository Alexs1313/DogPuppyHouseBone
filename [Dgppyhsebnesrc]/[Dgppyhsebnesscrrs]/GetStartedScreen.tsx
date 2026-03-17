import AnimatedPressable from '../Dgppyhuseboncmpnts/AnimatedPressable';

import { SLIDES as puppBonSlides } from '../Dgpyhseboncnsts/slides';

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

import Layout from '../Dgppyhuseboncmpnts/Layout';

const GetStartedScreen: React.FC = () => {
  const [puppBonSlideNumber, setPuppBonSlideNumber] = useState(0);
  const puppBonFadeAnim = useRef(new Animated.Value(0)).current;

  const puppBonNavigation = useNavigation<any>();

  const puppBonSlide = useMemo(
    () => puppBonSlides[puppBonSlideNumber],
    [puppBonSlideNumber],
  );

  const puppBonNextScreen = useCallback(() => {
    setPuppBonSlideNumber(prev => {
      if (prev < puppBonSlides.length - 1) return prev + 1;
      puppBonNavigation.replace('Tabroutes');
      return prev;
    });
  }, [puppBonNavigation]);

  useEffect(() => {
    puppBonFadeAnim.setValue(0);
    Animated.timing(puppBonFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [puppBonFadeAnim, puppBonSlideNumber]);

  return (
    <Layout>
      <View style={puppBonStyles.puppBonMaincontainer}>
        <Animated.View style={{ opacity: puppBonFadeAnim }}>
          <ImageBackground
            source={require('../assets/images/headerframe.png')}
            style={puppBonStyles.puppBonHeaderFrame}
            resizeMode="stretch"
          >
            <Text style={puppBonStyles.puppBonHeaderText}>
              {puppBonSlide.title}
            </Text>
          </ImageBackground>
        </Animated.View>

        <Animated.View style={{ opacity: puppBonFadeAnim }}>
          <Image
            source={puppBonSlide.image}
            style={puppBonStyles.puppBonSlideImage}
          />
        </Animated.View>

        <Animated.View style={{ opacity: puppBonFadeAnim }}>
          <ImageBackground
            source={require('../assets/images/textboard.png')}
            style={puppBonStyles.puppBonTextBoard}
            resizeMode="stretch"
          >
            <View style={puppBonStyles.puppBonTextPad}>
              <Text style={puppBonStyles.puppBonBoardText}>
                {puppBonSlide.text}
              </Text>
            </View>
          </ImageBackground>
        </Animated.View>

        <Animated.View style={{ opacity: puppBonFadeAnim }}>
          <AnimatedPressable activeOpacity={0.8} onPress={puppBonNextScreen}>
            <ImageBackground
              source={require('../assets/images/mainbutton.png')}
              style={puppBonStyles.puppBonButtonBoard}
              resizeMode="stretch"
            >
              <Text style={puppBonStyles.puppBonButtonText}>
                {puppBonSlide.button}
              </Text>
            </ImageBackground>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </Layout>
  );
};

export default GetStartedScreen;

const puppBonStyles = StyleSheet.create({
  puppBonMaincontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  puppBonHeaderFrame: {
    width: 314,
    height: 113,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonSlideImage: {
    marginTop: 30,
  },
  puppBonTextBoard: {
    width: 287,
    height: 211,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonTextPad: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  puppBonButtonBoard: {
    width: 218,
    height: 79,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puppBonHeaderText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Kanit-SemiBold',
    bottom: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  puppBonBoardText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Kanit-Regular',
  },
  puppBonButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Kanit-SemiBold',
  },
});
