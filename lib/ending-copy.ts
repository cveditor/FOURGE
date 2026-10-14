import type { SupportedLocale } from '@/lib/locale'

type EndingCopy = {
  shortEn: string
  longEn: string
  longIt: string
}

const ENDING_COPY: Record<string, EndingCopy> = {
  ghost_exit: {
    shortEn: 'The crew vanished before security understood the move.',
    longEn: 'Security never got a clean moment to react. While attention stayed fixed on the wrong places, your crew slipped through the hotel service routes and disappeared without creating a clear trail. By the time the alarm made sense, there was nobody left to chase.',
    longIt: 'La sicurezza non ha mai avuto un momento chiaro per reagire. Mentre l’attenzione restava concentrata nei posti sbagliati, la vostra crew è scivolata attraverso i passaggi di servizio dell’hotel senza lasciare una traccia evidente. Quando l’allarme ha finalmente avuto senso, non c’era più nessuno da inseguire.',
  },
  rooftop_run: {
    shortEn: 'The escape became a race above Monte Carlo.',
    longEn: 'The exit on the ground closed faster than expected, forcing the crew upward. You crossed the rooftops of Monte Carlo with security only seconds behind, relying on the escape route prepared before the heist began. It was not subtle, but it was fast enough to get the whole crew out.',
    longIt: 'L’uscita a livello strada si è chiusa più velocemente del previsto, costringendo la crew a salire sui tetti. Avete attraversato Monte Carlo con la sicurezza a pochi secondi di distanza, affidandovi alla via di fuga preparata prima del colpo. Non è stata una fuga discreta, ma è stata abbastanza veloce da portare fuori tutta la crew.',
  },
  sea_escape: {
    shortEn: 'A clean exit through the Monte Carlo marina.',
    longEn: 'With the case secured and the streets beginning to close, your crew abandoned the obvious escape routes and headed for the marina. The speedboat was exactly where it needed to be. Before security could lock down the waterfront, all four of you were already disappearing across the water.',
    longIt: 'Con la valigetta al sicuro e le strade che iniziavano a chiudersi, la vostra crew ha abbandonato le vie di fuga più ovvie e si è diretta verso il porto. Il motoscafo era esattamente dove doveva essere. Prima che la sicurezza potesse bloccare il lungomare, tutti e quattro stavate già sparendo sull’acqua.',
  },
  total_chaos: {
    shortEn: 'Nothing went to plan, but the crew kept moving.',
    longEn: 'The plan broke apart almost immediately. Alarms, security and unexpected movement turned the hotel into controlled chaos, forcing every member of the crew to improvise. It was messy and far from elegant, but somehow the four decisions still created a path out.',
    longIt: 'Il piano si è sgretolato quasi subito. Allarmi, sicurezza e movimenti imprevisti hanno trasformato l’hotel in un caos controllato, costringendo ogni membro della crew a improvvisare. È stato sporco e tutt’altro che elegante, ma in qualche modo le quattro decisioni hanno comunque creato una via d’uscita.',
  },
  silent_switch: {
    shortEn: 'The real move happened before anyone noticed.',
    longEn: 'The key moment of the heist happened almost invisibly. While the room looked unchanged, the real target was switched and the decoy was left exactly where security expected it to be. Your crew won because nobody realized a theft had happened until it was already over.',
    longIt: 'Il momento decisivo del colpo è avvenuto quasi senza essere visto. Mentre la stanza sembrava immutata, il vero obiettivo è stato sostituito e l’esca è rimasta esattamente dove la sicurezza si aspettava di trovarla. La vostra crew ha vinto perché nessuno si è accorto del furto finché era già tutto finito.',
  },
  front_door: {
    shortEn: 'The boldest exit was simply walking out.',
    longEn: 'Instead of hiding, running or searching for a secret exit, your crew did the opposite. You moved through the main entrance with enough confidence that security treated you like people who belonged there. The most exposed route became the safest one because nobody expected you to take it.',
    longIt: 'Invece di nascondervi, correre o cercare un’uscita segreta, la vostra crew ha fatto l’opposto. Siete passati dall’ingresso principale con abbastanza sicurezza da sembrare persone che avevano tutto il diritto di essere lì. La via più esposta è diventata la più sicura proprio perché nessuno si aspettava che la sceglieste.',
  },
  inside_job: {
    shortEn: 'The cleanest path came from inside.',
    longEn: 'Someone inside the operation opened a route the rest of the building never saw. Doors, timing and access aligned in your favour, letting the crew move through spaces that should have been closed. The heist succeeded because the strongest part of the plan was already behind security lines.',
    longIt: 'Qualcuno all’interno dell’operazione ha aperto una strada che il resto dell’edificio non ha mai visto. Porte, tempi e accessi si sono allineati a vostro favore, permettendo alla crew di attraversare zone che avrebbero dovuto essere chiuse. Il colpo è riuscito perché la parte più forte del piano era già oltre le linee della sicurezza.',
  },
  decoy: {
    shortEn: 'Everyone watched the wrong move.',
    longEn: 'Security reacted exactly where your crew wanted them to react. The decoy became the centre of attention while the real operation moved quietly somewhere else. By the time anyone understood which event actually mattered, the important part of the heist was already complete.',
    longIt: 'La sicurezza ha reagito esattamente dove la vostra crew voleva che reagisse. L’esca è diventata il centro dell’attenzione mentre la vera operazione si muoveva silenziosamente altrove. Quando qualcuno ha capito quale evento contava davvero, la parte importante del colpo era già conclusa.',
  },
  blackout: {
    shortEn: 'When the lights died, the game changed.',
    longEn: 'The lights went out and the entire rhythm of the building changed. Security lost visibility, guests created confusion and your crew used the darkness as a moving window of opportunity. What looked like a crisis for everyone else became the exact moment you needed to move.',
    longIt: 'Le luci si sono spente e l’intero ritmo dell’edificio è cambiato. La sicurezza ha perso visibilità, gli ospiti hanno creato confusione e la vostra crew ha usato il buio come una finestra di opportunità in movimento. Quello che per tutti gli altri sembrava una crisi è diventato esattamente il momento di cui avevate bisogno.',
  },
  hunt: {
    shortEn: 'The trail led into a deeper game.',
    longEn: 'Your crew could have disappeared with the score, but one clue was too important to ignore. Instead of ending the operation, you followed the trail and discovered that the heist was connected to something larger. You escaped the first problem only to step voluntarily into the next one.',
    longIt: 'La vostra crew avrebbe potuto sparire con il bottino, ma un indizio era troppo importante per essere ignorato. Invece di chiudere l’operazione, avete seguito la traccia e scoperto che il colpo era collegato a qualcosa di più grande. Avete superato il primo problema solo per entrare volontariamente nel successivo.',
  },
  double_back: {
    shortEn: 'The escape route became the deception.',
    longEn: 'The crew let the pursuit believe it understood your route, then reversed the entire escape at the right moment. Security committed to the wrong direction while you doubled back through the space they had already cleared. The escape worked because the route itself became the trick.',
    longIt: 'La crew ha lasciato credere agli inseguitori di aver capito la vostra via di fuga, poi ha invertito tutto nel momento giusto. La sicurezza si è impegnata nella direzione sbagliata mentre voi tornavate attraverso uno spazio che aveva già liberato. La fuga ha funzionato perché la strada stessa è diventata l’inganno.',
  },
  bigger_score: {
    shortEn: 'The original target was never the final prize.',
    longEn: 'Halfway through the operation, your crew discovered an opportunity worth far more than the original target. Instead of playing safe, you changed the objective and pushed deeper into the heist. The risk increased immediately, but so did the reward — and this time the gamble paid off.',
    longIt: 'A metà dell’operazione, la vostra crew ha scoperto un’opportunità che valeva molto più dell’obiettivo iniziale. Invece di giocare sul sicuro, avete cambiato bersaglio e siete andati più a fondo nel colpo. Il rischio è aumentato immediatamente, ma anche la ricompensa — e questa volta l’azzardo ha funzionato.',
  },
  burned_plan: {
    shortEn: 'The plan collapsed. The crew adapted.',
    longEn: 'The original plan was compromised before the crew could finish it. From that point on there was no clean script to follow: every move depended on reading the room and reacting faster than security. You did not win by executing the plan — you survived by abandoning it at the right time.',
    longIt: 'Il piano originale è stato compromesso prima che la crew potesse completarlo. Da quel momento non esisteva più uno schema pulito da seguire: ogni mossa dipendeva dal leggere la situazione e reagire più velocemente della sicurezza. Non avete vinto eseguendo il piano — siete usciti perché avete saputo abbandonarlo al momento giusto.',
  },
  masterstroke: {
    shortEn: 'A brilliant operation, executed with total control.',
    longEn: 'Every part of the operation landed where it needed to. The distraction held security in place, the route stayed open and the final move gave your crew control of the heist from beginning to end. You did not simply get away — you made a complicated operation look deliberate and effortless.',
    longIt: 'Ogni parte dell’operazione è finita esattamente dove doveva. La distrazione ha tenuto impegnata la sicurezza, la via di fuga è rimasta aperta e la mossa finale ha dato alla vostra crew il controllo del colpo dall’inizio alla fine. Non siete semplicemente riusciti a scappare — avete fatto sembrare semplice e intenzionale un’operazione complessa.',
  },
  perfect_heist: {
    shortEn: 'No wasted movement. No visible mistake.',
    longEn: 'Nothing important went wrong. Every player made a decision that supported the others, the timing stayed intact and security never found a moment to recover. The crew entered, completed the objective and disappeared with almost no evidence that the operation had ever been at risk.',
    longIt: 'Nulla di importante è andato storto. Ogni giocatore ha preso una decisione che ha sostenuto quelle degli altri, i tempi sono rimasti intatti e la sicurezza non ha mai trovato un momento per recuperare. La crew è entrata, ha completato l’obiettivo ed è sparita lasciando pochissimi segnali che l’operazione sia mai stata davvero in pericolo.',
  },
  the_039: {
    shortEn: 'One route. One secret. One impossible outcome.',
    longEn: 'The heist everyone thought they were playing was only the surface. Your four decisions aligned into the single hidden route buried inside all 256 possibilities, revealing an objective the ordinary endings never reach. This is FOURGE’s secret outcome: one exact combination, found by almost nobody.',
    longIt: 'Il colpo che tutti pensavano di stare giocando era soltanto la superficie. Le vostre quattro decisioni si sono allineate nell’unico percorso nascosto tra tutte le 256 possibilità, rivelando un obiettivo che i finali normali non raggiungono mai. Questo è il finale segreto di FOURGE: una combinazione esatta, trovata da quasi nessuno.',
  },
  'the-039': {
    shortEn: 'One route. One secret. One impossible outcome.',
    longEn: 'The heist everyone thought they were playing was only the surface. Your four decisions aligned into the single hidden route buried inside all 256 possibilities, revealing an objective the ordinary endings never reach. This is FOURGE’s secret outcome: one exact combination, found by almost nobody.',
    longIt: 'Il colpo che tutti pensavano di stare giocando era soltanto la superficie. Le vostre quattro decisioni si sono allineate nell’unico percorso nascosto tra tutte le 256 possibilità, rivelando un obiettivo che i finali normali non raggiungono mai. Questo è il finale segreto di FOURGE: una combinazione esatta, trovata da quasi nessuno.',
  },
}

export function getEndingShortDescription(endingCode: string) {
  return ENDING_COPY[endingCode]?.shortEn || 'Your four secret choices forged this outcome.'
}

export function getEndingLongDescription(endingCode: string, locale: SupportedLocale) {
  const copy = ENDING_COPY[endingCode]
  if (!copy) {
    return locale === 'it-IT'
      ? 'Le quattro scelte segrete della vostra crew si sono combinate in questo finale.'
      : 'Your crew’s four secret choices combined to create this ending.'
  }
  return locale === 'it-IT' ? copy.longIt : copy.longEn
}
