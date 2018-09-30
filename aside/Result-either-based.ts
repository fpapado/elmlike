/**
 * Version of Result based on an `either` function.
 * It is less readable imo, since the matches are implicit and also TS syntax
 * does not help. If the type inference and currying was more seamless, then
 * it could be nicer. As it stands, I find the version with matches nicer.
 * It is a nice showcase of the idea that this is all built on the continuation
 * model.
 * */
export {
  Result,
  Ok,
  Err,
  match,
  matchC,
  withDefault,
  map,
  map2,
  map3,
  andThen,
  mapErr,
  mapBoth,
  toMaybe,
  fromMaybe,
};

import * as Maybe from './Maybe';

// TYPES

type Result<Error, Value> = Ok<Value> | Err<Error>;

type Ok<Value> = {$: 'Ok'; a: Value};

type Err<Error> = {$: 'Err'; a: Error};

// TYPE CONSTRUCTORS

const Ok = <X, V>(value: V): Result<X, V> => ({
  $: 'Ok',
  a: value,
});

// TODO: Decide if we want Err() or Err
const Err = <X, V>(error: X): Result<X, V> => ({
  $: 'Err',
  a: error,
});

// PATTERN MATCHING

// Object that encodes a match
type MatchDefinition<Error, Value, ReturnType> = {
  Ok: (value: Value) => ReturnType;
  Err: (error: Error) => ReturnType;
};

/** Function that allows pattern-matching on the tag of Result
 */
const match = <E, V, RT>(result: Result<E, V>, matchDef: MatchDefinition<E, V, RT>) => {
  switch (result.$) {
    case 'Ok':
      return matchDef.Ok(result.a);
    case 'Err':
      return matchDef.Err(result.a);
  }
};

/** Curried version of match. Useful for separating behaviour from data.
 * @todo: Perhaps there is a nice way to merge this with match?
 */
const matchC = <E, V, RT>(matchDef: MatchDefinition<E, V, RT>) => (result: Result<E, V>) =>
  match<E, V, RT>(result, matchDef);

// HELPERS

/** Apply either a success function, or a failure function, depending on the shape of the Result. */
const either = <E, V, RT>(
  successFn: (value: V) => RT,
  errorFn: (err: E) => RT,
  result: Result<E, V>
): RT =>
  match(result, {
    Ok: successFn,
    Err: errorFn,
  });

// NOTE: withDefault can also be `def => result => either(identity, err => def)`

/** Return the value if Ok, otherwise return a default value. */
const withDefault = <V>(def: V, result: Result<any, V>): V => either(a => a, _err => def, result);

// MAPPING

/** Apply function a -> b if the result is Ok, and propagate Err otherwise
 *  (a -> value) -> Result x a -> Result x value
 */
const map = <E, VA, VB>(fn: (a: VA) => VB, result: Result<E, VA>): Result<E, VB> =>
  either(a => Ok(fn(a)), e => Err(e), result);

/** Apply a function if all the arguments are Ok.
 *  If not, the first `Err` will propagate through.
 */
const map2 = <A, B, E, V>(
  fn: (a: A, b: B) => V,
  ra: Result<E, A>,
  rb: Result<E, B>
): Result<E, V> => either(a => either(b => Ok(fn(a, b)), e => Err(e), rb), e => Err(e), ra);

const map3 = <A, B, C, E, V>(
  fn: (a: A, b: B, c: C) => V,
  ra: Result<E, A>,
  rb: Result<E, B>,
  rc: Result<E, C>
): Result<E, V> =>
  either(
    a => either(b => either(c => Ok(fn(a, b, c)), e => Err(e), rc), e => Err(e), rb),
    e => Err(e),
    ra
  );

/** Transform the Err branch. Useful for converting between error types.
 */
const mapErr = <EA, EB, V>(fn: (errA: EA) => EB, result: Result<EA, V>): Result<EB, V> =>
  either(a => Ok(a), e => Err(fn(e)), result);

/** Apply functions to both parts of Result, transforming the types.
 * Also known as bimap.
 * Useful for transforming two one-input functions into one two-input function.
 */
const mapBoth = <EA, VA, EB, VB>(
  mapErr: (err: EA) => EB,
  mapOk: (value: VA) => VB,
  resA: Result<EA, VA>
): Result<EB, VB> => either(a => Ok(mapOk(a)), err => Err(mapErr(err)), resA);

/** Chain together computations that may fail.
 */
const andThen = <E, VA, VB>(fn: (va: VA) => Result<E, VB>) => (
  result: Result<E, VA>
): Result<E, VB> => either(fn, err => Err(err), result);

/** Convert to a simpler `Maybe` if the actual error message is not needed or
 * you need to interact with some code that primarily uses maybes.
 */
const toMaybe = <E, V>(result: Result<E, V>): Maybe.Maybe<V> =>
  either(a => Maybe.Just(a), _err => Maybe.Nothing(), result);

/** Convert from a simple `Maybe` to interact with some code that primarily
 * uses results
 */
const fromMaybe = <E, V>(err: E, maybe: Maybe.Maybe<V>): Result<E, V> =>
  Maybe.match<V, Result<E, V>>(maybe, {
    Just: a => Ok(a),
    Nothing: () => Err(err),
  });

// TODO: GUARDS
