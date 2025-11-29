import React, { useEffect, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  style?: any;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, style, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animValue = React.useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      animValue.removeListener(listener);
    };
  }, [value, duration]);

  return <Text style={style}>{displayValue}</Text>;
};

export default AnimatedNumber;

