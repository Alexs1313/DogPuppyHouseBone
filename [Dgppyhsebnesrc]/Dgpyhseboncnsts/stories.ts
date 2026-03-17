export type StoryId =
  | 'lost-ball'
  | 'brave-jump'
  | 'pink-secret'
  | 'faithful-guard'
  | 'friendship-day'
  | 'night-shower'
  | 'new-trick';

export type StoryItem = {
  id: StoryId;
  title: string;
  text: string;
  image: any;
};

export const STORIES: StoryItem[] = [
  {
    id: 'lost-ball',
    title: 'Lost Ball',
    image: require('../assets/images/dogsstory1.png'),
    text: `I am a cheerful pug with a red collar. One morning my beloved blue ball disappeared. I ran around the whole yard, looked under the bench, even checked the flowerbed where the tulips grow.

My nose worked like a real detective. I sniffed the tracks and suddenly realized - the wind had rolled the ball out the gate. I barked softly to call the owner. He smiled and helped me get the treasure.

From that day on, I realized: even if something is lost, you should not panic. You just need to use your sense of smell and a little patience.`,
  },
  {
    id: 'brave-jump',
    title: 'Brave Jump',
    image: require('../assets/images/dogsstory2.png'),
    text: `I am a red-haired beagle, and I love adventures. Once I saw a small puddle after the rain. For some, it is a trifle, but for me it was a whole river!

I walked around it for a long time, estimating the distance. My heart was beating fast. And then - I ran and jumped! My paws got a little wet, but I landed on the other side.

I was so proud. And I realized: sometimes fear is just a small puddle that you can jump over.`,
  },
  {
    id: 'pink-secret',
    title: 'Pink Secret',
    image: require('../assets/images/dogsstory3.png'),
    text: `I am a little snow-white beauty with a pink bow. People think that I am just posing for a photo, but I have a secret.

Every evening I quietly go down the stairs and guard the house. I hear every sound, every rustle. And if something seems suspicious - I immediately become alert.

Being cute is great. But being brave and attentive is even better.`,
  },
  {
    id: 'faithful-guard',
    title: 'Faithful Guard',
    image: require('../assets/images/dogsstory4.png'),
    text: `I am a Rottweiler with a serious look. My job is to guard the yard. One day I heard a strange noise near the fence.

I did not bark right away. I froze and listened. It was just a cat that ran by. I calmly returned to my place.

Real strength is not loud barking. It is confidence and calm.`,
  },
  {
    id: 'friendship-day',
    title: 'Friendship Day',
    image: require('../assets/images/dogsstory5.png'),
    text: `We all met in the park. I, the pug, brought a ball. The beagle brought a twig. The little beauty brought her favorite toy. The Rottweiler just sat nearby and watched.

At first, we played separately. But then we started sharing. The ball became common, the twig too.

That day we realized: playing together is more fun.`,
  },
  {
    id: 'night-shower',
    title: 'Night Shower',
    image: require('../assets/images/dogsstory6.png'),
    text: `A thunderstorm started at night. I, the beagle, was a little afraid of thunder. I snuggled up to the pug, and the little beauty hid next to the Rottweiler.

The thunder was loud, but together it was not so scary. We supported each other.

When the downpour ended, we fell asleep peacefully. Because true courage is when you are not alone.`,
  },
  {
    id: 'new-trick',
    title: 'New Trick',
    image: require('../assets/images/dogsstory7.png'),
    text: `Our owner decided to teach us a new trick - to sit at the same time on command. At first, no one could concentrate.

The pug was distracted by the treat, the beagle was sniffing the grass, I (a Rottweiler) was just waiting patiently, and the beauty was spinning in place.

But after a few attempts, we all sat down at the same time. The owner laughed and gave us treats.

We realized: if we try together, everything will definitely work out.`,
  },
];
