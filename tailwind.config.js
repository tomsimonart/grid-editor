const colors = require('tailwindcss/colors')

module.exports = {
  purge: {
    enabled:  false, //!process.env.ROLLUP_WATCH,
    mode: 'all',
    content: ['./**/**/*.html', './**/**/*.svelte'],
    options: {
      whitelistPatterns: [/svelte-/],
      defaultExtractor: (content) =>
        [...content.matchAll(/(?:class:)*([\w\d-/:%.]+)/gm)].map(([_match, group, ..._rest]) => group),
    },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      'body': ['roboto']
    },
    extend: {
      margin:{
        '14': '3.5rem'
      },
      zIndex: {
        '-10':'-10',
      },
      fontFamily: {
        'mono' : 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        'aldo' : 'Aldo-SemiBold',
        'roboto-sans' : 'Roboto Sans',
        'gt-pressura': 'GT Pressura Pro M Trial',
        'roboto' : 'Roboto',
        'roboto-mono' : 'Roboto Mono'
      },
      cursor: {
        'helper': 'help'
      },
      minHeight: {
        '200': '200px',
        '300': '300px'
      },
      height: {
        '32': '8rem',
        '14': '3.5rem',
        '64': '16rem',
        '72': '18rem',
        '128': '32rem',
        '600': '600px',
        '300': '300px',
        'calc': 'calc(100vh - 62px)'
      },
      inset: {
        '1/2': '50%',
        '1': '1em',
        '9/10': '0.9em',
        '-1': '-1em',
      },
      borderWidth: {
        '8': '8px',
        '16': '16px'
      },
      colors: {
        black: colors.black,
        white: colors.white,
        gray: colors.trueGray,
        green: colors.green,
        red: colors.rose,
        yellow: colors.amber,
        pink: colors.pink,
        purple: colors.purple,
        orange: colors.orange,
        primary: {
          'DEFAULT': '#1e2628',
          '100':'#d3dcde',
          '200':'#b6c5c8',
          '300':'#99adb2',
          '400':'#7c969d',
          '500':'#627d83',
          '600':'#4d6166',
          '700':'#374549',
          '800':'#212a2c',
          '900': '#0b0e0f',
        },
        pick: {
          'DEFAULT': '#6B7AFF',
          'desaturate-10': '#8591FF',
          'desaturate-20': '#A9AEFF',
          'saturate-10': '#5263FF',
          'saturate-20': '#1F4AC5',
          'complementer': '#FFEE52'
        },
        select: {
          'DEFAULT': '#47575F',
          'saturate-10': '#3E545F',
          'saturate-20': '#1A2A31',
          'desaturate-10': '#515A5F',
          'desaturate-20': '#788991'
        },
        commit: {
          'DEFAULT': '#0BA484',
          'saturate-10': '#00A482',
          'saturate-20': '#006F53',
          'desaturate-10': '#1BA487',
          'desaturate-20': '#5DDCB9'

        },
        secondary: {
          'DEFAULT': '#2a3439',
        },
        normal: '#cfdbd5',
        thirdery: {
          'DEFAULT': '#31313F'
        },
        highlight: {
          'DEFAULT': '#CC5B5B',
          '100':'#edc5c5',
          '200':'#e19e9e',
          '300':'#d57777',
          '400':'#c95050',
          '500':'#af3636',
          '600':'#882a2a'
        },
        important: {
          'DEFAULT': '#e4d203',
          '100': '#fffde6',
          '200': '#fef8b3',
          '300': '#fdf381',
          '400': '#fdef4f',
          '500': '#fcea1c',
          '600': '#e3d103',
          '700': '#b0a202'
        },
        configs: {
          'cb': '#887880',
          'glc': '#88A096',
          'glp': '#BBAB8B',
          'l': '#EF8275',
          'gks': '#9AD4D6',
          'gms': '#DBCBD8',
          'sbc': '#065A82',
          'sec': '#963D5A',
          'glut': '#78BC61'

        }
      },
    }
  },
  variants: {
    textColor: ['group-hover'],
    visibility: ['hover'],
    backgroundColor: ['hover','group-hover'],
    cursor: ['group-hover'],
    borderRadius: ['hover'],
    height: ['group-hover', 'hover'],
    scale: ['hover','group-hover'],
    display: ['hover', 'group-hover'],
    visibility: ['hover', 'group-hover']
  },
  plugins: []
}