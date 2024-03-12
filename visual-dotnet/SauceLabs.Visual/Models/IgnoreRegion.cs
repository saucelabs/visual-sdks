namespace SauceLabs.Visual.Models
{
    public class IgnoreRegion
    {
        public string? Name { get; set; }
        public int Height { get; }
        public int Width { get; }
        public int X { get; }
        public int Y { get; }

        public IgnoreRegion(int x, int y, int width, int height)
        {
            X = x;
            Y = y;
            Width = width;
            Height = height;
        }
    }
}