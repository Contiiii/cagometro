export const MOTIVATIONAL_PHRASES = [
  "Ogni passo conta. Anche il più piccolo.",
  "Missione compiuta. L'eroe non si ferma mai.",
  "Un click, un progresso. Semplice e potente.",
  "Il tuo futuro ti ringrazia.",
  "Costanza da campioni. Continua così.",
  "Meglio oggi che domani. E lo hai appena fatto.",
  "Il record non si batte da solo.",
  "Stai costruendo qualcosa di grande.",
  "La costanza batte il talento. Sempre.",
  "Piccolo gesto, grande striscia.",
  "Ecco perché sei più forte di ieri.",
  "Ogni volta che registri, il tuo ritmo cresce.",
  "Ben fatto. La scia di oggi sarà il record di domani.",
  "Non fermarti: il divertimento è proprio qui.",
  "Una registrazione alla volta, verso la vetta.",
  "Il dettaglio di oggi è il risultato di domani.",
];

export function pickRandomPhrase(previousPhrase) {
  let phrase = previousPhrase;

  while (phrase === previousPhrase) {
    phrase =
      MOTIVATIONAL_PHRASES[
        Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
      ];
  }

  return phrase;
}