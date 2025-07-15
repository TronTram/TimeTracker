# Audio Files

This directory contains audio files for the Timer Tracker application.

## Structure

```
public/audio/
├── notification.mp3          # Default notification sound
├── success.mp3              # Success notification sound
└── ambient/                 # Ambient sounds directory
    ├── rain.mp3            # Rain ambient sound
    ├── forest.mp3          # Forest ambient sound
    ├── ocean.mp3           # Ocean waves ambient sound
    ├── white-noise.mp3     # White noise ambient sound
    └── cafe.mp3            # Coffee shop ambient sound
```

## Audio Requirements

### Format
- **Primary**: MP3 format for broad browser compatibility
- **Fallback**: OGG for Firefox and other browsers that prefer open formats
- **Quality**: 128-192 kbps for good balance of quality and file size

### Notification Sounds
- **Duration**: 1-3 seconds
- **Volume**: Normalized to prevent jarring sounds
- **Style**: Pleasant, non-intrusive tones

### Ambient Sounds
- **Duration**: 60+ seconds (seamlessly loopable)
- **Volume**: Consistent levels across all files
- **Style**: Calming, non-distracting background sounds

## File Sources

For production use, you'll need to add actual audio files. Here are some suggestions:

### Free Resources
- **Freesound.org**: High-quality sound effects and ambient sounds
- **Zapsplat**: Professional sound library (free with registration)
- **BBC Sound Effects**: Free sound effects library

### Recommended Ambient Sounds
- **Rain**: Gentle rainfall, avoid thunder or heavy downpours
- **Forest**: Birds chirping, light wind through trees
- **Ocean**: Gentle waves, avoid storm sounds
- **White Noise**: Steady, consistent tone
- **Cafe**: Light chatter, coffee machine sounds, no music

### Creating Notification Sounds
- Use simple, pleasant tones (chimes, bells, soft beeps)
- Avoid harsh or jarring sounds
- Test at different volume levels
- Consider accessibility (some users may be sensitive to certain frequencies)

## Implementation Notes

The application will gracefully handle missing audio files by:
1. Showing appropriate error messages
2. Disabling audio features if files are unavailable
3. Providing fallback silent mode

## Licensing

Ensure all audio files are properly licensed for your use case:
- Use Creative Commons licensed sounds
- Purchase commercial licenses where required
- Credit original creators as needed
- Keep documentation of sources and licenses

## Development

For development purposes, you can:
1. Use the placeholder files (they won't actually play sounds)
2. Add your own audio files following the naming convention
3. Test with short sample files before adding full-length content

## Performance

Keep file sizes reasonable:
- Notification sounds: < 100KB each
- Ambient sounds: < 5MB each (consider compression)
- Total audio directory: < 50MB recommended
