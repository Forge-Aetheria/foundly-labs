import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '../theme/tokens';

type Variant = keyof typeof typography;

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  style,
  ...rest
}: AppTextProps) {
  const textStyle: TextStyle = { ...typography[variant], color };
  return <Text {...rest} style={[textStyle, style]} />;
}
