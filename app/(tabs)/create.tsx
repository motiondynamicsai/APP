import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import Slider from '@react-native-community/slider';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

const Create = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [videoUri, setVideoUri] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(true); 
  const [videoPosition, setVideoPosition] = useState(0); 
  const [videoDuration, setVideoDuration] = useState(0); 
  const [detector, setDetector] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryStatus.status === 'granted');

      await tf.ready();
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      const loadedDetector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
      setDetector(loadedDetector);
    })();
  }, []);

  const processVideo = async (videoUri) => {
    const video = videoRef.current;
    if (video && detector) {
      video.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          const snapshot = await video.getTextureAsync(); 
          const poses = await detector.estimatePoses(snapshot);
          console.log(poses); 
        }
      });
    }
  };

  const pickVideo = async () => {
    if (hasGalleryPermission === false) {
      Alert.alert('Permission required', 'This app needs access to your gallery to upload videos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      Alert.alert('Video Selected', 'Video successfully uploaded!');
      processVideo(result.assets[0].uri); 
    }
  };

  const openCamera = async () => {
    if (hasCameraPermission === false) {
      Alert.alert('Permission required', 'This app needs access to your camera.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      Alert.alert('Video Captured', 'Video successfully recorded!');
      processVideo(result.assets[0].uri); 
    }
  };

  const closeVideo = () => {
    setVideoUri(null); 
    setIsPlaying(false); 
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      videoRef.current.pauseAsync();
    } else {
      videoRef.current.playAsync();
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setVideoPosition(status.positionMillis);
      setVideoDuration(status.durationMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {videoUri ? (
        <View style={styles.videoBox}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="cover"
            shouldPlay={isPlaying}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            style={styles.video}
          />
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
              <Text style={styles.controlButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={videoDuration}
              value={videoPosition}
              onValueChange={value => videoRef.current.setPositionAsync(value)}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
            />
            <Text style={styles.timeText}>
              {Math.floor(videoPosition / 1000)}s / {Math.floor(videoDuration / 1000)}s
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={closeVideo}>
            <Text style={styles.closeButtonText}>Close Video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.box} onPress={pickVideo}>
          <Image
            source={require('../../assets/images/file.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.text}>Upload Video</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.box} onPress={openCamera}>
        <Image
          source={require('../../assets/images/camera.png')} 
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.text}>Use Camera</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  box: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  videoBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default Create;
