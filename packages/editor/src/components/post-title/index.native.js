/**
 * External dependencies
 */

import { View } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import {
    __experimentalRichText as RichText,
    create,
    insert,
} from '@wordpress/rich-text';
import { decodeEntities } from '@wordpress/html-entities';
import { withDispatch, withSelect } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { pasteHandler } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const PostTitle = (props) => {


    

    useEffect(() => {
		// Unselect if any other block is selected and blur the RichText.
		if (
			props.isSelected &&
			! prevProps.isAnyBlockSelected &&
			props.isAnyBlockSelected
		) {
			if ( richTextRefHandler ) {
				richTextRefHandler.blur();
			}
			props.onUnselect();
		}
	}, []);
    useEffect(() => {
		if ( props.innerRef ) {
			props.innerRef( this );
		}
	}, []);
    const handleFocusOutsideHandler = useCallback(() => {
		props.onUnselect();
	}, []);
    const focusHandler = useCallback(() => {
		props.onSelect();
	}, []);
    const onPasteHandler = useCallback(( { value, onChange, plainText } ) => {
		const content = pasteHandler( {
			plainText,
			mode: 'INLINE',
			tagName: 'p',
		} );

		if ( typeof content === 'string' ) {
			const valueToInsert = create( { html: content } );
			onChange( insert( value, valueToInsert ) );
		}
	}, []);
    const setRefHandler = useCallback(( richText ) => {
		richTextRefHandler = richText;
	}, []);
    const getTitleHandler = useCallback(( title, postType ) => {
		if ( 'page' === postType ) {
			return isEmpty( title )
				? /* translators: accessibility text. empty page title. */
				  __( 'Page title. Empty' )
				: sprintf(
						/* translators: accessibility text. %s: text content of the page title. */
						__( 'Page title. %s' ),
						title
				  );
		}

		return isEmpty( title )
			? /* translators: accessibility text. empty post title. */
			  __( 'Post title. Empty' )
			: sprintf(
					/* translators: accessibility text. %s: text content of the post title. */
					__( 'Post title. %s' ),
					title
			  );
	}, []);

    const {
			placeholder,
			style,
			title,
			focusedBorderColor,
			borderStyle,
			isDimmed,
			postType,
			globalStyles,
		} = props;

		const decodedPlaceholder = decodeEntities( placeholder );
		const borderColor = props.isSelected
			? focusedBorderColor
			: 'transparent';
		const titleStyles = {
			...style,
			...( globalStyles?.text && {
				color: globalStyles.text,
				placeholderColor: globalStyles.text,
			} ),
		};

		return (
			<View
				style={ [
					styles.titleContainer,
					borderStyle,
					{ borderColor },
					isDimmed && styles.dimmed,
				] }
				accessible={ ! props.isSelected }
				accessibilityLabel={ getTitleHandler( title, postType ) }
				accessibilityHint={ __( 'Updates the title.' ) }
			>
				<RichText
					setRef={ setRefHandler }
					accessibilityLabel={ getTitleHandler( title, postType ) }
					tagName={ 'p' }
					tagsToEliminate={ [ 'strong' ] }
					unstableOnFocus={ props.onSelect }
					onBlur={ props.onBlur } // Always assign onBlur as a props.
					multiline={ false }
					style={ titleStyles }
					styles={ styles }
					fontSize={ 24 }
					lineHeight={ 1 }
					fontWeight={ 'bold' }
					deleteEnter={ true }
					onChange={ ( value ) => {
						props.onUpdate( value );
					} }
					onPaste={ onPasteHandler }
					placeholder={ decodedPlaceholder }
					value={ title }
					onSelectionChange={ () => {} }
					onEnter={ props.onEnterPress }
					disableEditingMenu={ true }
					__unstableIsSelected={ props.isSelected }
					__unstableOnCreateUndoLevel={ () => {} }
				></RichText>
			</View>
		); 
};




export default compose(
	withSelect( ( select ) => {
		const { isPostTitleSelected, getEditedPostAttribute } =
			select( editorStore );
		const { getSelectedBlockClientId, getBlockRootClientId, getSettings } =
			select( blockEditorStore );

		const selectedId = getSelectedBlockClientId();
		const selectionIsNested = !! getBlockRootClientId( selectedId );
		const globalStyles =
			getSettings()?.__experimentalGlobalStylesBaseStyles?.color;

		return {
			postType: getEditedPostAttribute( 'type' ),
			isAnyBlockSelected: !! selectedId,
			isSelected: isPostTitleSelected(),
			isDimmed: selectionIsNested,
			globalStyles,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { undo, redo, togglePostTitleSelection } =
			dispatch( editorStore );

		const { clearSelectedBlock, insertDefaultBlock } =
			dispatch( blockEditorStore );

		return {
			onEnterPress() {
				insertDefaultBlock( undefined, undefined, 0 );
			},
			onUndo: undo,
			onRedo: redo,
			onSelect() {
				togglePostTitleSelection( true );
				clearSelectedBlock();
			},
			onUnselect() {
				togglePostTitleSelection( false );
			},
		};
	} ),
	withInstanceId,
	withFocusOutside
)( PostTitle );
