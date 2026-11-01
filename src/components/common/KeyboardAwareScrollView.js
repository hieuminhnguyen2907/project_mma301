import React, { createContext, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';

export const KeyboardAwareContext = createContext({
  scrollToInput: () => {},
});

export const KeyboardAwareScrollView = forwardRef(
  (
    {
      children,
      style,
      contentContainerStyle,
      extraScrollHeight = 80,
      keyboardVerticalOffset = 0,
      keyboardShouldPersistTaps = 'handled',
      showsVerticalScrollIndicator = false,
      enableAutomaticScroll = true,
      onScroll,
      scrollEventThrottle = 16,
      // Size to the content instead of filling the parent (for containers with only a
      // maxHeight, e.g. a modal card). The parent must then handle the keyboard itself.
      fitContent = false,
      ...restProps
    },
    ref
  ) => {
    const internalScrollRef = useRef(null);
    const scrollOffsetRef = useRef(0);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const focusedInputRef = useRef(null);

    useImperativeHandle(ref, () => internalScrollRef.current);

    useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const onKeyboardShow = (event) => {
        const height = event?.endCoordinates?.height || 280;
        setKeyboardHeight(height);

        // If an input is focused when the keyboard finishes popping up, scroll it into view
        if (enableAutomaticScroll && focusedInputRef.current) {
          scrollNodeIntoView(focusedInputRef.current, height);
        }
      };

      const onKeyboardHide = () => {
        setKeyboardHeight(0);
        focusedInputRef.current = null;
      };

      const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
      const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, [enableAutomaticScroll, extraScrollHeight]);

    const scrollNodeIntoView = (inputNode, currentKbHeight = keyboardHeight) => {
      if (!inputNode || !internalScrollRef.current) return;

      setTimeout(() => {
        try {
          const windowHeight = Dimensions.get('window').height;
          const kbHeight = currentKbHeight || 280;
          const keyboardTop = windowHeight - kbHeight;

          const applyScroll = (y, height) => {
            if (typeof y !== 'number') return;
            const inputBottom = y + height;
            const safeZoneBottom = keyboardTop - extraScrollHeight;

            if (inputBottom > safeZoneBottom) {
              const delta = inputBottom - safeZoneBottom;
              const targetY = scrollOffsetRef.current + delta;
              internalScrollRef.current?.scrollTo?.({ y: Math.max(0, targetY), animated: true });
            } else if (y < extraScrollHeight) {
              const delta = y - extraScrollHeight;
              const targetY = scrollOffsetRef.current + delta;
              internalScrollRef.current?.scrollTo?.({ y: Math.max(0, targetY), animated: true });
            }
          };

          if (typeof inputNode.measureInWindow === 'function') {
            inputNode.measureInWindow((_x, y, _width, height) => {
              applyScroll(y, height);
            });
          } else if (typeof inputNode.measure === 'function') {
            inputNode.measure((_x, _y, _width, height, _pageX, pageY) => {
              applyScroll(pageY, height);
            });
          }
        } catch (_err) {
          // Graceful no-op if node unmounted
        }
      }, Platform.OS === 'ios' ? 60 : 100);
    };

    const scrollToInput = (inputNode) => {
      focusedInputRef.current = inputNode;
      if (enableAutomaticScroll) {
        scrollNodeIntoView(inputNode);
      }
    };

    const handleScroll = (event) => {
      if (event?.nativeEvent?.contentOffset) {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      }
      onScroll?.(event);
    };

    const flattenedContainerStyle = StyleSheet.flatten(contentContainerStyle) || {};
    const basePaddingBottom = flattenedContainerStyle.paddingBottom || 0;

    return (
      <KeyboardAwareContext.Provider value={{ scrollToInput }}>
        <KeyboardAvoidingView
          style={[fitContent ? styles.fitContent : styles.avoidingView, style]}
          behavior={Platform.OS === 'ios' && !fitContent ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <ScrollView
            ref={internalScrollRef}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            onScroll={handleScroll}
            scrollEventThrottle={scrollEventThrottle}
            {...restProps}
            contentContainerStyle={[
              contentContainerStyle,
              {
                paddingBottom:
                  basePaddingBottom +
                  (keyboardHeight > 0 && !fitContent ? keyboardHeight + extraScrollHeight : 0),
              },
            ]}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </KeyboardAwareContext.Provider>
    );
  }
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

const styles = StyleSheet.create({
  avoidingView: {
    flex: 1,
  },
  // flex: 1 would give a zero flex-basis and collapse inside a parent that has no height
  fitContent: {
    flexGrow: 0,
    flexShrink: 1,
  },
});
