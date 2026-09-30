import Svg, { Path, Circle } from 'react-native-svg';
import { iconColors } from '@/lib/design/chart';
export type IconName = 'view' | 'heart' | 'comment' | 'more' | 'arrow' | 'share' | 'save' | 'flag' | 'edit' | 'best' | 'check' | 'close' | 'university' | 'book' | 'people' | 'search' | 'award' | 'chart' | 'compare' | 'info' | 'linkedin' | 'globe';
export function Icon({ name, tone = 'muted', size = 16 }: { name: IconName; tone?: keyof typeof iconColors; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={name === 'heart' && tone === 'liked' ? iconColors.liked : 'none'} stroke={iconColors[tone]} strokeWidth={1.7} accessible={false}>
    {name === 'linkedin' ? <><Path d="M3.5 3.5h17v17h-17zM7.5 10v7.5m0-10v.1M11.5 17.5V10m0 3.5c0-2.2 1.4-3.5 3.2-3.5 2 0 3.1 1.2 3.1 3.5v4" strokeLinecap="round" strokeLinejoin="round" /></>
      : name === 'globe' ? <><Circle cx={12} cy={12} r={9} /><Path d="M3 12h18M12 3c2.5 2.5 3.7 5.5 3.7 9s-1.2 6.5-3.7 9M12 3C9.5 5.5 8.3 8.5 8.3 12s1.2 6.5 3.7 9" strokeLinecap="round" /></>
      : name === 'university' ? <Path d="m3 8 9-5 9 5H3Zm2 3v8m7-8v8m7-8v8M3 21h18" />
      : name === 'book' ? <Path d="M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Zm0 0v15" />
      : name === 'people' ? <><Circle cx={9} cy={7} r={3} /><Path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v2" /></>
      : name === 'search' ? <><Circle cx={10} cy={10} r={6} /><Path d="m15 15 6 6" /></>
      : name === 'award' ? <><Circle cx={12} cy={8} r={5} /><Path d="m8 12-2 9 6-3 6 3-2-9" /></>
      : name === 'chart' ? <Path d="M4 3v18h18M9 17v-6m5 6V7m5 10V4" />
      : name === 'compare' ? <Path d="M3 7h18m-4-4 4 4-4 4M21 17H3m4-4-4 4 4 4" />
      : name === 'info' ? <><Circle cx={12} cy={12} r={9} /><Path d="M12 11v6m0-11v1" /></>
      : name === 'save' ? <Path d="M6 3.5h12v17l-6-4-6 4v-17Z" />
      : name === 'flag' ? <Path d="M6 21V4m0 1h11l-2 4 2 4H6" />
      : name === 'edit' ? <><Path d="m4 20 4.5-1 11-11-3.5-3.5-11 11L4 20Z" /><Path d="m14.5 6 3.5 3.5" /></>
      : name === 'best' ? <Path d="m5 12 4 4L19 6" />
      : name === 'close' ? <Path d="m6 6 12 12M18 6 6 18" /> : name === 'view' ? <><Path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><Circle cx={12} cy={12} r={2.5} /></> : name === 'heart' ? <Path d="M20.8 5.8a5.1 5.1 0 0 0-7.2 0L12 7.4l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2L12 21l8.8-8a5.1 5.1 0 0 0 0-7.2Z" /> : name === 'comment' ? <Path d="M4 4.5h16v12H9l-5 4v-16Z" /> : name === 'more' ? <><Circle cx={5} cy={12} r={1.5} fill={iconColors[tone]} stroke="none" /><Circle cx={12} cy={12} r={1.5} fill={iconColors[tone]} stroke="none" /><Circle cx={19} cy={12} r={1.5} fill={iconColors[tone]} stroke="none" /></> : name === 'arrow' ? <Path d="M4 12h16m-6-6 6 6-6 6" /> : name === 'check' ? <Path d="m5 12 4 4 10-10" /> : <Path d="M12 16V3m-5 5 5-5 5 5M5 12v8h14v-8" />}
  </Svg>;
}
