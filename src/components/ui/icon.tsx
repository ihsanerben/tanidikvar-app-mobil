import Svg, { Path, Circle } from 'react-native-svg';
import { iconColors } from '@/lib/design/chart';
export type IconName = 'view' | 'heart' | 'comment' | 'more' | 'arrow' | 'share' | 'check';
export function Icon({ name, tone = 'muted', size = 16 }: { name: IconName; tone?: keyof typeof iconColors; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColors[tone]} strokeWidth={1.7} accessible={false}>
    {name === 'view' ? <><Path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><Circle cx={12} cy={12} r={2.5} /></> : name === 'heart' ? <Path d="M20.8 5.8a5.1 5.1 0 0 0-7.2 0L12 7.4l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2L12 21l8.8-8a5.1 5.1 0 0 0 0-7.2Z" /> : name === 'comment' ? <Path d="M4 4.5h16v12H9l-5 4v-16Z" /> : name === 'more' ? <><Circle cx={5} cy={12} r={1} /><Circle cx={12} cy={12} r={1} /><Circle cx={19} cy={12} r={1} /></> : name === 'arrow' ? <Path d="M4 12h16m-6-6 6 6-6 6" /> : name === 'check' ? <Path d="m5 12 4 4 10-10" /> : <Path d="M12 16V3m-5 5 5-5 5 5M5 12v8h14v-8" />}
  </Svg>;
}
