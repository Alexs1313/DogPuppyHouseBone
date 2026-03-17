import React, { useCallback, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

type AnimatedPressableProps = TouchableOpacityProps & {
  pressScale?: number;
};

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPressIn,
  onPressOut,
  disabled,
  pressScale = 0.92,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        speed: 28,
        bounciness: 6,
        useNativeDriver: true,
      }).start();
    },
    [scale],
  );

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) animateTo(pressScale);
      onPressIn?.(e);
    },
    [animateTo, disabled, onPressIn, pressScale],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) animateTo(1);
      onPressOut?.(e);
    },
    [animateTo, disabled, onPressOut],
  );

  return (
    <TouchableOpacity
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedPressable;
