using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SauceLabs.Visual.Utils
{
    internal static class DictionaryExtensions
    {
        private static readonly SemaphoreSlim Semaphore = new SemaphoreSlim(1, 1);

        public static async Task<TValue> GetOrAddAsync<TKey, TValue>(this IDictionary<TKey, TValue> dict, TKey key, Func<TKey, Task<TValue>> valueProvider)
        {
            await Semaphore.WaitAsync();
            try
            {
                if (dict == null) throw new ArgumentNullException(nameof(dict));
                if (key == null) throw new ArgumentNullException(nameof(key));
                if (valueProvider == null) throw new ArgumentNullException(nameof(valueProvider));

                if (dict.TryGetValue(key, out var foundValue))
                    return foundValue;

                dict[key] = await valueProvider(key);
                return dict[key];
            }
            finally
            {
                Semaphore.Release();
            }
        }
    }
}