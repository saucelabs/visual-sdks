namespace SauceLabs.Visual.Utils
{
    internal static class JsonUndefined
    {
        public static JsonUndefined<T> Value<T>(T value)
        {
            return new JsonUndefined<T>(value);
        }

        public static JsonUndefined<T> Undefined<T>()
        {
            return new JsonUndefined<T>();
        }
    }

    internal class JsonUndefined<T>
    {
        public bool HasValue { get; }
        public T Value { get; }

        public JsonUndefined(T value)
        {
            HasValue = true;
            Value = value;
        }

        public JsonUndefined()
        {
            HasValue = false;
            Value = default!;
        }
    }
}
