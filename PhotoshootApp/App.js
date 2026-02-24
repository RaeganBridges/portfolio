import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

const savePicture = async (tag) => {
  try {
    const result = await CameraRoll.save(tag, { type: 'photo' });
    console.log('Saved:', result);
    Alert.alert('Saved', 'Image saved to your camera roll.');
  } catch (error) {
    console.error('Error saving:', error);
    Alert.alert('Error', error?.message || 'Could not save image.');
  }
};

export default function App() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Save to Camera Roll</Text>
      <Text style={styles.hint}>
        Enter an image URL (must be a direct link to a photo)
      </Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/image.jpg"
        placeholderTextColor="#999"
        value={imageUrl}
        onChangeText={setImageUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.buttonWrap}>
        <Button
          title="Save"
          onPress={() => {
            if (imageUrl.trim()) {
              savePicture(imageUrl.trim());
            } else {
              Alert.alert('Enter URL', 'Please enter an image URL first.');
            }
          }}
        />
      </View>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.preview}
          resizeMode="contain"
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8c4ce',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5c2a38',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#6b3a45',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonWrap: {
    marginBottom: 24,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
});
