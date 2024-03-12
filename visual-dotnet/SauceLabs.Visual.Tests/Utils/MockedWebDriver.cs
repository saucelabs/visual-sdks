using OpenQA.Selenium;

namespace SauceLabs.Visual.Tests.Utils;

internal class MockedWebDriver : IHasCapabilities, IHasSessionId
{
    public ICapabilities Capabilities { get; }
    public SessionId SessionId { get; }

    public MockedWebDriver(ICapabilities caps, string sessionId)
    {
        Capabilities = caps;
        SessionId = new SessionId(sessionId);
    }
}