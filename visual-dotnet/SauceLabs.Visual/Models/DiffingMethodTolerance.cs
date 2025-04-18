using SauceLabs.Visual.GraphQL;

namespace SauceLabs.Visual.Models
{
    public class DiffingMethodTolerance
    {
        public int? MinChangeSize { get; set; }
        public double? Color { get; set; }
        public double? AntiAliasing { get; set; }
        public double? Brightness { get; set; }

        internal DiffingMethodToleranceIn ToDiffingMethodToleranceIn()
        {
            return new DiffingMethodToleranceIn()
            {
                AntiAliasing = AntiAliasing,
                Color = Color,
                MinChangeSize = MinChangeSize,
                Brightness = Brightness,
            };
        }
    }
}