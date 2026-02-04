import React, { useEffect, useRef } from 'react';
import { View, Image, ScrollView, ImageBackground } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  GetStartedScreen: undefined;
};

const IntroLoader: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      navigation.navigate('GetStartedScreen');
    }, 6000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [navigation]);

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
          <Image
            source={require('../assets/images/ioslogo.png')}
            style={{ width: 329, height: 329, borderRadius: 32 }}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default IntroLoader;
