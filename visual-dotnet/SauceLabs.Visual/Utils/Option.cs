namespace SauceLabs.Visual.Utils
{
    public static class Option
    {
        public static Option<T> Some<T>(T value)
        {
            return new Option<T>(value, true);
        }

        public static Option<T> None<T>()
        {
            return new Option<T>();
        }
    }

    public readonly struct Option<T>
    {
        public bool HasValue { get; }
        public T Value { get; }

        internal Option(T value, bool hasValue)
        {
            HasValue = hasValue;
            Value = value;
        }

        public static implicit operator Option<T>(T t)
        {
            return Option.Some(t);
        }

        public static implicit operator T(Option<T> t)
        {
            return t.Value;
        }
    }
}
