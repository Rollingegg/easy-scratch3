/**
 * @fileoverview
 * Utility function to look up whether a translated video exists for a locale.
 */

// TODO: ja-Hira are copies of ja, replace with real ja-Hira when available.
const videos = {
    'intro-move-sayhello': {
        'en': 'rpjvs3v9gj',
        'zh-cn': '9i01bspmyx'
    },
    'animate-a-name': {
        en: 'pyur30ho05'
    },
    'Make-Music': {
        en: 'ir0j8ljsgm'
    },
    'Make-A-Game': {
        en: '5rp47ys13g'
    },
    'Chase-Game': {
        en: 'kusyx9thl5'
    },
    'add-a-backdrop': {
        en: 'nict6zdzlx'
    },
    'change-size': {
        en: 'p8va85hh61'
    },
    'glide-around': {
        en: 'sh9j978rg8'
    },
    'record-a-sound': {
        en: 'ulzl1fbzny'
    },
    'spin-video': {
        en: '07fed5hhpv'
    },
    'hide-and-show': {
        en: 'g479ahobo9'
    },
    'switch-costume': {
        en: '1ocp6a1ejn'
    },
    'move-around-with-arrow-keys': {
        en: 'yetrmk4iuu'
    },
    'add-effects': {
        en: '3jvl8zgjo2'
    },
    'make-it-fly': {
        en: 'zbtdx2dem9'
    },
    'pong-game': {
        en: '8m48dv0ens'
    },
    'imagine': {
        en: '1ndh08yiso'
    },
    'code-cartoon': {
        en: 'fpfuky3x6g'
    },
    'talking': {
        en: 'j0208mq4qi'
    }
};

/**
 * Return a video identifier (on our video hosting service)
 * @param {string} videoId key in the videos object, or id string.
 * @param {string} locale locale to look up. If locale is not defined return the id for 'en' by default
 * @return {string} identifier for the video on our video hosting service.
 */
const translateVideo = (videoId, locale) => {
    // if the videoId is not recognized in the videos object, assume it's already a video id on wistia
    if (!videos.hasOwnProperty(videoId)) return videoId;
    if (videos[videoId].hasOwnProperty(locale)) {
        return videos[videoId][locale];
    }
    return videos[videoId].en;
};

export {
    translateVideo
};
