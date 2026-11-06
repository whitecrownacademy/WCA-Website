export const assets = {
 hero:{src:'/images/learning-together.webp',alt:'Illustrative Indian children exploring wooden blocks with an educator'},
 creative:{src:'/images/creative-learning.webp',alt:'Illustrative children painting and exploring art materials with an educator'},
};
export const galleryItems = [
 {id:'discovery',category:'Discovery',asset:assets.hero,title:'The joy of figuring it out'},
 {id:'creativity',category:'Creativity',asset:assets.creative,title:'A world of colour and possibility'},
];

export const programmeImages = {
 'day-care': {...assets.hero, position:'17% center'},
 'junior-kg': {...assets.creative, position:'15% center'},
 'senior-kg': {...assets.hero, position:'76% center'},
 'after-school': {...assets.creative, position:'85% center'},
};
