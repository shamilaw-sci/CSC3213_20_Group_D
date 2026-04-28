/**
 * @file    App.js
 * @module  Root
 * @desc    Root component for Care4U mobile app.
 *          Simple bottom tab navigation between patient screens.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import PatientQRCardScreen  from './src/screens/PatientQRCardScreen';

const TABS = [
  { key: 'profile', label: 'My Profile' },
  { key: 'qrcard',  label: 'QR Card'    },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <View style={styles.root}>

      {/* Screen Area */}
      <View style={styles.screen}>
        {activeTab === 'profile' && <PatientProfileScreen />}
        {activeTab === 'qrcard'  && <PatientQRCardScreen  />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection:   'row',
    backgroundColor: '#1E3A5F',
    paddingBottom:   40,
    paddingTop:      12,
    borderTopWidth:  1,
    borderTopColor:  '#2E75B6',
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
  },
  tabLabel: {
    fontSize:   13,
    color:      '#93C5FD',
    fontWeight: '400',
  },
  tabLabelActive: {
    color:      '#FFFFFF',
    fontWeight: '600',
  },
  tabIndicator: {
    marginTop:       4,
    width:           32,
    height:          3,
    backgroundColor: '#FFFFFF',
    borderRadius:    2,
  },
});