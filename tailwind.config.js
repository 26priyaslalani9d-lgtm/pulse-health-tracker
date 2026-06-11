/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bgtop: '#0A0A0B',
        bgbottom: '#0F0F12',
        card: '#1C1C22',
        cardborder: '#23232A',
        steps: '#34D26A',
        distance: '#F5C518',
        calories: '#FF4D4D',
        heart: '#FF3B7A',
        streak: '#8B5CF6',
        sleepacc: '#5EA0EF',
        spo2acc: '#4DD0E1',
        stressacc: '#F97316',
        goldfrom: '#E8C46A',
        goldto: '#B8862C',
        tprimary: '#F5F5F7',
        tsecondary: '#A1A1AA',
        ttertiary: '#6B6B73',
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        grotesk: ['SpaceGrotesk_700Bold'],
        'grotesk-medium': ['SpaceGrotesk_500Medium'],
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
};
