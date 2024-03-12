using System;

namespace SauceLabs.Visual
{
    public class VisualClientException : Exception
    {
        public override string Message { get; }

        public VisualClientException(string message) : base(message)
        {
            Message = message;
        }
    }
}