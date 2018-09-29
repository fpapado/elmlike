type Maybe<A> = Nothing | Just<A>;

type Nothing = {$: 'Nothing'};

type Just<A> = {$: 'Just'; a: A};

export const Just = <A>(data: A): Just<A> => ({$: 'Just', a: data});
