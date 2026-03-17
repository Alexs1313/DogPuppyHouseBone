// IntroLoader

import { View, Animated, ScrollView, ImageBackground } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import React, { useEffect, useRef } from 'react';

type RootStackParamList = {
  GetStartedScreen: undefined;
};

const IntroLoader: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      navigation.replace('GetStartedScreen');
    }, 6000);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [navigation, pulse]);

  return (
    <ImageBackground
      source={require('../assets/images/introback.png')}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.Image
            source={require('../assets/images/ioslogo.png')}
            style={{
              width: 329,
              height: 329,
              borderRadius: 32,
              transform: [{ scale: pulse }],
            }}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default IntroLoader;
