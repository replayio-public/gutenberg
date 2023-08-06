/**
 * External dependencies
 */

import { ScrollView, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { removeFilter } from '@wordpress/hooks';
import {
    withInstanceId,
    compose,
    withPreferredColorScheme,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';
import styles from './style.scss';

export export const HTMLTextInput = (props) => {


    

    useEffect(() => {
    return () => {
		removeFilter( 'native.persist-html', 'html-text-input' );
		// TODO: Blocking main thread.
		stopEditingHandler();
	};
}, []);
    const editHandler = useCallback(( html ) => {
		props.onChange( html );
		setValue(html);
    setIsDirty(true);
	}, []);
    const getHTMLForParentHandler = useCallback(() => {
		return value;
	}, []);
    const stopEditingHandler = useCallback(() => {
		if ( isDirty ) {
			props.onPersist( value );
			setIsDirty(false);
		}
	}, []);

    const {
			editTitle,
			getStylesFromColorScheme,
			parentHeight,
			style,
			title,
		} = props;
		const titleStyle = [
			styles.htmlViewTitle,
			style?.text && { color: style.text },
		];
		const htmlStyle = [
			getStylesFromColorScheme( styles.htmlView, styles.htmlViewDark ),
			style?.text && { color: style.text },
		];
		const placeholderStyle = {
			...getStylesFromColorScheme(
				styles.placeholder,
				styles.placeholderDark
			),
			...( style?.text && { color: style.text } ),
		};
		return (
			<KeyboardAvoidingView
				style={ styles.keyboardAvoidingView }
				parentHeight={ parentHeight }
			>
				<ScrollView style={ styles.scrollView }>
					<TextInput
						autoCorrect={ false }
						accessibilityLabel="html-view-title"
						textAlignVertical="center"
						numberOfLines={ 1 }
						style={ titleStyle }
						value={ title }
						placeholder={ __( 'Add title' ) }
						placeholderTextColor={ placeholderStyle.color }
						onChangeText={ editTitle }
					/>
					<TextInput
						ref={ contentTextInputRefHandler }
						autoCorrect={ false }
						accessibilityLabel="html-view-content"
						textAlignVertical="top"
						multiline
						style={ htmlStyle }
						value={ value }
						onChangeText={ editHandler }
						onBlur={ stopEditingHandler }
						placeholder={ __( 'Start writing…' ) }
						placeholderTextColor={ placeholderStyle.color }
						scrollEnabled={ false }
						// [Only iOS] This prop prevents the text input from
						// automatically getting focused after scrolling
						// content.
						rejectResponderTermination={ false }
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		); 
};

HTMLTextInput.getDerivedStateFromProps = ( props, state ) => {
		if ( state.isDirty ) {
			return null;
		}

		return {
			value: props.value,
			isDirty: false,
		};
	};


export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute, getEditedPostContent } =
			select( 'core/editor' );

		return {
			title: getEditedPostAttribute( 'title' ),
			value: getEditedPostContent(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, resetEditorBlocks } = dispatch( 'core/editor' );
		return {
			editTitle( title ) {
				editPost( { title } );
			},
			onChange( content ) {
				editPost( { content } );
			},
			onPersist( content ) {
				const blocks = parse( content );
				resetEditorBlocks( blocks );
			},
		};
	} ),
	withInstanceId,
	withPreferredColorScheme,
] )( HTMLTextInput );
