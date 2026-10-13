import type { SupportedLocale } from '@/lib/locale'

export type RoleStory = {
  label: string
  short: string
  headline: string
  briefing: string
  objective: string
}

export const ROLE_STORIES: Record<SupportedLocale, Record<string, RoleStory>> = {
  'it-IT': {
    architect: {
      label: 'L’ARCHITETTO',
      short: 'Sei la mente del colpo. Studi persone, spazi e movimenti prima che la crew faccia la prima mossa.',
      headline: 'IL PIANO PARTE DA TE.',
      briefing: 'La crew è pronta, ma nessuno si muove finché tu non decidi come leggere il bersaglio. Devi trovare il vantaggio che permetterà agli altri tre di agire senza sapere quali mosse sceglieranno.',
      objective: 'Il tuo compito: creare l’apertura giusta senza attirare l’attenzione.',
    },
    driver: {
      label: 'IL DRIVER',
      short: 'Controlli la fuga. Il colpo non è riuscito finché tutta la crew non è sparita.',
      headline: 'TU DEVI FARLI SPARIRE.',
      briefing: 'La valigetta può anche essere nelle mani della crew, ma quello è solo metà del lavoro. Quando la sicurezza capirà cosa sta succedendo, tutti dipenderanno dalla via di fuga che hai scelto tu.',
      objective: 'Il tuo compito: preparare l’uscita prima ancora che il colpo inizi.',
    },
    diplomat: {
      label: 'IL DIPLOMATICO',
      short: 'Gestisci persone, sicurezza e coperture. Quando qualcuno fa domande, sei tu a dare la risposta giusta.',
      headline: 'LA SICUREZZA TI STA GUARDANDO.',
      briefing: 'Qualcuno ha notato movimenti insoliti. Una guardia si avvicina e la finestra per agire si sta chiudendo. Devi spostare l’attenzione lontano dalla crew senza far saltare il piano.',
      objective: 'Il tuo compito: controllare la situazione senza mostrare che la stai controllando.',
    },
    maverick: {
      label: 'IL MAVERICK',
      short: 'Sei l’imprevisto. Puoi salvare il colpo, trasformarlo o mandare tutto fuori controllo.',
      headline: 'IL PIANO FUNZIONA. PER ORA.',
      briefing: 'Gli altri stanno seguendo la strategia, ma tu hai visto qualcosa che potrebbe cambiare tutto. Nessuno sa quale sarà la tua mossa: sei l’unico autorizzato a rompere lo schema.',
      objective: 'Il tuo compito: decidere se proteggere il piano o rischiare per qualcosa di più grande.',
    },
  },
  'en-US': {
    architect: {
      label: 'THE ARCHITECT',
      short: 'You are the mind behind the heist. You study people, spaces and movement before the crew makes its first move.',
      headline: 'THE PLAN STARTS WITH YOU.',
      briefing: 'The crew is ready, but nobody moves until you decide how to read the target. You need to create the opening that lets the other three act without knowing which moves they will choose.',
      objective: 'Your job: create the right opening without drawing attention.',
    },
    driver: {
      label: 'THE DRIVER',
      short: 'You control the escape. The heist is not a success until the entire crew has disappeared.',
      headline: 'YOU HAVE TO MAKE THEM DISAPPEAR.',
      briefing: 'Getting the case is only half the job. The moment security understands what is happening, everyone depends on the escape route you prepared before the heist began.',
      objective: 'Your job: prepare the exit before anyone needs it.',
    },
    diplomat: {
      label: 'THE DIPLOMAT',
      short: 'You control people, security and cover stories. When someone asks questions, you need the right answer.',
      headline: 'SECURITY IS WATCHING YOU.',
      briefing: 'Someone has noticed unusual movement. A guard is getting closer and the window to act is closing. You need to pull attention away from the crew without exposing the plan.',
      objective: 'Your job: control the situation without looking like you are controlling it.',
    },
    maverick: {
      label: 'THE MAVERICK',
      short: 'You are the wildcard. You can save the heist, transform it, or push everything into chaos.',
      headline: 'THE PLAN IS WORKING. FOR NOW.',
      briefing: 'The others are following the strategy, but you have spotted something that could change everything. Nobody knows your move: you are the only one allowed to break the pattern.',
      objective: 'Your job: decide whether to protect the plan or risk it for something bigger.',
    },
  },
}

export const PLAYER_COPY = {
  'it-IT': {
    invalidSession: 'Sessione giocatore non valida',
    invalidName: 'Scrivi il nome con cui la crew deve riconoscerti.', joinFailure: 'Non è stato possibile entrare nella crew',
    roleFailure: 'Non è stato possibile bloccare il ruolo', photoRequired: 'Scegli una foto chiara in cui ci sei solo tu.',
    consentRequired: 'Conferma che la foto è tua e che FOURGE può usarla per il risultato di questa Crew.', photoFailure: 'Non è stato possibile caricare la foto', choiceFailure: 'Non è stato possibile bloccare la scelta',
    loading: 'APERTURA SESSIONE…', privateSession: 'SESSIONE PRIVATA', who: <>CHI<br /><em>SEI?</em></>,
    intro: 'Stai per entrare in THE HEIST. Le tue decisioni resteranno segrete e si combineranno con quelle degli altri tre giocatori.',
    yourName: 'IL TUO NOME', join: 'ENTRA NELLA CREW', joining: 'ENTRANDO…',
    phaseRole: 'FASE 02 / 04', heistStart: <>IL COLPO<br /><em>STA PER INIZIARE.</em></>,
    storyPlace: 'MONTE CARLO · 23:47', storyStrong: 'Una valigetta. Quattro persone. Nessuno conosce le scelte degli altri.',
    storyBody: 'Il bersaglio è all’interno di un hotel sorvegliato. La crew ha una sola occasione per prendere la valigetta e sparire prima che la sicurezza capisca cosa sta succedendo. Ognuno di voi controllerà una parte diversa del colpo. Le quattro decisioni, prese in segreto, creeranno il vostro finale.',
    nowYou: 'ORA TOCCA A TE', roleInstruction: 'Scegli il ruolo che avrai nel colpo.', roleHint: 'Chi arriva prima lo blocca. Una volta scelto, il ruolo non può più essere preso da un altro giocatore.',
    taken: 'GIÀ SCELTO', available: 'DISPONIBILE', takenBy: 'SCELTO DA', member: 'UN MEMBRO DELLA CREW', lock: 'SCEGLI QUESTO RUOLO ↗', locking: 'BLOCCANDO…',
    noCompare: '◇ NON CONFRONTATEVI SULLE SCELTE. IL FINALE FUNZIONA SOLO SE OGNUNO DECIDE DA SOLO.',
    phasePhoto: 'FASE 03 / 04', identity: 'IDENTITÀ', photoTitle: <>ORA ENTRI<br /><em>NELLA STORIA.</em></>,
    photoIntro: 'Carica una foto chiara in cui ci sei solo tu. Non viene mostrata agli altri: servirà più avanti per trasformare la vostra crew nella Ending Card finale del colpo.',
    choosePhoto: 'SCATTA O SCEGLI UNA FOTO', photoFormats: 'JPG · PNG · WEBP · MAX 8 MB', consent: 'Questa foto è mia. Autorizzo FOURGE a usarla per generare il risultato di questa Crew.', confirmPhoto: 'CONFERMA FOTO', uploading: 'CARICAMENTO…', photoAlt: 'Anteprima foto selezionata',
    phaseChoice: 'FASE 04 / 04 · DECISIONE SEGRETA', fallbackMoment: 'È IL TUO MOMENTO.', briefing: 'IL TUO BRIEFING', situation: 'LA SITUAZIONE',
    choiceHint: 'Scegli una sola mossa. Non esiste una risposta “giusta”: la tua decisione si unirà in segreto a quelle degli altri tre e determinerà il finale della crew.', chooseMove: 'FAI QUESTA MOSSA ↗', secret: '◇ LA TUA SCELTA È SEGRETA. GLI ALTRI GIOCATORI NON LA VEDRANNO.',
    ready: 'PRONTO ✓', moveLocked: <>LA TUA MOSSA<br /><em>È BLOCCATA.</em></>, photoChoiceDone: 'FOTO ✓ · SCELTA SEGRETA ✓', playersReady: 'GIOCATORI PRONTI',
    readyNote: 'Ora non puoi cambiare la tua decisione. Aspetta che gli altri completino la loro parte del colpo: quando sarete 4/4, FOURGE combinerà le quattro mosse e rivelerà cosa è successo davvero.',
    enterRoom: 'ENTRA NELLA WAITING ROOM', crewStatus: 'STATO CREW', present: 'PRESENTI', player: 'Giocatore', preparing: 'IN PREPARAZIONE…', waitingSpot: 'Posto libero', waiting: 'IN ATTESA',
    outcomeReady: '4/4 BLOCCATI · FINALE PRONTO', reveal: 'RIVELA IL FINALE',
  },
  'en-US': {
    invalidSession: 'Invalid player session', invalidName: 'Enter the name your crew should know you by.', joinFailure: 'Could not join the crew', roleFailure: 'Could not lock your role',
    photoRequired: 'Choose a clear photo showing only you.', consentRequired: 'Confirm the photo is yours and FOURGE may use it for this Crew result.', photoFailure: 'Could not upload the photo', choiceFailure: 'Could not lock your choice',
    loading: 'OPENING SESSION…', privateSession: 'PRIVATE SESSION', who: <>WHO<br /><em>ARE YOU?</em></>,
    intro: 'You are about to enter THE HEIST. Your decisions stay secret and will combine with the choices made by the other three players.',
    yourName: 'YOUR NAME', join: 'ENTER THE CREW', joining: 'ENTERING…',
    phaseRole: 'STEP 02 / 04', heistStart: <>THE HEIST<br /><em>IS ABOUT TO BEGIN.</em></>,
    storyPlace: 'MONTE CARLO · 23:47', storyStrong: 'One case. Four people. Nobody knows the others’ choices.',
    storyBody: 'The target is inside a guarded hotel. The crew has one chance to take the case and disappear before security understands what is happening. Each of you controls a different part of the heist. Four decisions, made in secret, will create your ending.',
    nowYou: 'YOUR MOVE', roleInstruction: 'Choose the role you will play in the heist.', roleHint: 'First to claim it owns it. Once a role is locked, no other player can take it.',
    taken: 'TAKEN', available: 'AVAILABLE', takenBy: 'TAKEN BY', member: 'A CREW MEMBER', lock: 'CLAIM THIS ROLE ↗', locking: 'LOCKING…',
    noCompare: '◇ DO NOT COMPARE CHOICES. THE ENDING ONLY WORKS IF EVERYONE DECIDES ALONE.',
    phasePhoto: 'STEP 03 / 04', identity: 'IDENTITY', photoTitle: <>NOW YOU ENTER<br /><em>THE STORY.</em></>,
    photoIntro: 'Upload a clear photo showing only you. The others will not see it: later it will be used to turn your crew into the final Ending Card.',
    choosePhoto: 'TAKE OR CHOOSE A PHOTO', photoFormats: 'JPG · PNG · WEBP · MAX 8 MB', consent: 'This photo is mine. I allow FOURGE to use it to generate this Crew result.', confirmPhoto: 'CONFIRM PHOTO', uploading: 'UPLOADING…', photoAlt: 'Selected photo preview',
    phaseChoice: 'STEP 04 / 04 · SECRET DECISION', fallbackMoment: 'THIS IS YOUR MOMENT.', briefing: 'YOUR BRIEFING', situation: 'THE SITUATION',
    choiceHint: 'Choose one move. There is no single “right” answer: your decision will combine in secret with the other three and determine the crew’s ending.', chooseMove: 'MAKE THIS MOVE ↗', secret: '◇ YOUR CHOICE IS SECRET. THE OTHER PLAYERS WILL NOT SEE IT.',
    ready: 'READY ✓', moveLocked: <>YOUR MOVE<br /><em>IS LOCKED.</em></>, photoChoiceDone: 'PHOTO ✓ · SECRET CHOICE ✓', playersReady: 'PLAYERS READY',
    readyNote: 'You cannot change your decision now. Wait for the others to complete their part of the heist. At 4/4, FOURGE combines all four moves and reveals what really happened.',
    enterRoom: 'ENTER THE WAITING ROOM', crewStatus: 'CREW STATUS', present: 'PRESENT', player: 'Player', preparing: 'SETTING UP…', waitingSpot: 'Open spot', waiting: 'WAITING',
    outcomeReady: '4/4 LOCKED · ENDING READY', reveal: 'REVEAL THE ENDING',
  },
} as const
