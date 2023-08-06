/**
 * External dependencies
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * WordPress dependencies
 */
import RNReactNativeGutenbergBridge, {
    requestBlockTypeImpressions,
    setBlockTypeImpressions,
    subscribeParentGetHtml,
    subscribeParentToggleHTMLMode,
    subscribeUpdateHtml,
    subscribeSetTitle,
    subscribeMediaAppend,
    subscribeReplaceBlock,
    subscribeUpdateEditorSettings,
    subscribeUpdateCapabilities,
    subscribeShowNotice,
    subscribeShowEditorHelp,
} from '@wordpress/react-native-bridge';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { count as wordCount } from '@wordpress/wordcount';
import {
    parse,
    serialize,
    getUnregisteredTypeHandlerName,
    createBlock,
} from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { applyFilters } from '@wordpress/hooks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getGlobalStyles, getColorsAndGradients } from '@wordpress/components';
import { NEW_BLOCK_TYPES } from '@wordpress/block-library';
import { EditorHelpTopics, store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as editPostStore } from '@wordpress/edit-post';

const postTypeEntities = [
	{ name: 'post', baseURL: '/wp/v2/posts' },
	{ name: 'page', baseURL: '/wp/v2/pages' },
	{ name: 'attachment', baseURL: '/wp/v2/media' },
	{ name: 'wp_block', baseURL: '/wp/v2/blocks' },
].map( ( postTypeEntity ) => ( {
	kind: 'postType',
	...postTypeEntity,
	transientEdits: {
		blocks: true,
		selection: true,
	},
	mergedEdits: {
		meta: true,
	},
	rawAttributes: [ 'title', 'excerpt', 'content' ],
} ) );

/**
 * Internal dependencies
 */

const NativeEditorProvider = (props) => {


    const [isHelpVisible, setIsHelpVisible] = useState(false);

    useEffect(() => {
		const { capabilities, locale, hostAppNamespace, updateSettings } =
			props;

		updateSettings( {
			...capabilities,
			...getThemeColorsHandler( props ),
			locale,
			hostAppNamespace,
		} );

		subscriptionParentGetHtmlHandler = subscribeParentGetHtml( () => {
			serializeToNativeActionHandler();
		} );

		subscriptionParentToggleHTMLModeHandler = subscribeParentToggleHTMLMode(
			() => {
				toggleModeHandler();
			}
		);

		subscriptionParentSetTitleHandler = subscribeSetTitle( ( payload ) => {
			props.editTitle( payload.title );
		} );

		subscriptionParentUpdateHtmlHandler = subscribeUpdateHtml(
			( payload ) => {
				updateHtmlActionHandler( payload.html );
			}
		);

		subscriptionParentReplaceBlockHandler = subscribeReplaceBlock(
			( payload ) => {
				replaceBlockActionHandler( payload.html, payload.clientId );
			}
		);

		subscriptionParentMediaAppendHandler = subscribeMediaAppend(
			( payload ) => {
				const blockName = 'core/' + payload.mediaType;
				const newBlock = createBlock( blockName, {
					id: payload.mediaId,
					[ payload.mediaType === 'image' ? 'url' : 'src' ]:
						payload.mediaUrl,
				} );

				const indexAfterSelected = props.selectedBlockIndex + 1;
				const insertionIndex =
					indexAfterSelected || props.blockCount;

				props.insertBlock( newBlock, insertionIndex );
			}
		);

		subscriptionParentUpdateEditorSettingsHandler =
			subscribeUpdateEditorSettings(
				( { galleryWithImageBlocks, ...editorSettings } ) => {
					if ( typeof galleryWithImageBlocks === 'boolean' ) {
						window.wp.galleryBlockV2Enabled =
							galleryWithImageBlocks;
					}
					updateSettings( getThemeColorsHandler( editorSettings ) );
				}
			);

		subscriptionParentUpdateCapabilitiesHandler = subscribeUpdateCapabilities(
			( payload ) => {
				updateCapabilitiesActionHandler( payload );
			}
		);

		subscriptionParentShowNoticeHandler = subscribeShowNotice(
			( payload ) => {
				props.createSuccessNotice( payload.message );
			}
		);

		subscriptionParentShowEditorHelpHandler = subscribeShowEditorHelp( () => {
			setIsHelpVisible(true);
		} );

		// Request current block impressions from native app.
		requestBlockTypeImpressions( ( storedImpressions ) => {
			const impressions = { ...NEW_BLOCK_TYPES, ...storedImpressions };

			// Persist impressions to JavaScript store.
			updateSettings( { impressions } );

			// Persist impressions to native store if they do not include latest
			// `NEW_BLOCK_TYPES` configuration.
			const storedImpressionKeys = Object.keys( storedImpressions );
			const storedImpressionsCurrent = Object.keys(
				NEW_BLOCK_TYPES
			).every( ( newKey ) => storedImpressionKeys.includes( newKey ) );
			if ( ! storedImpressionsCurrent ) {
				setBlockTypeImpressions( impressions );
			}
		} );
	}, []);
    useEffect(() => {
    return () => {
		if ( subscriptionParentGetHtmlHandler ) {
			subscriptionParentGetHtmlHandler.remove();
		}

		if ( subscriptionParentToggleHTMLModeHandler ) {
			subscriptionParentToggleHTMLModeHandler.remove();
		}

		if ( subscriptionParentSetTitleHandler ) {
			subscriptionParentSetTitleHandler.remove();
		}

		if ( subscriptionParentUpdateHtmlHandler ) {
			subscriptionParentUpdateHtmlHandler.remove();
		}

		if ( subscriptionParentReplaceBlockHandler ) {
			subscriptionParentReplaceBlockHandler.remove();
		}

		if ( subscriptionParentMediaAppendHandler ) {
			subscriptionParentMediaAppendHandler.remove();
		}

		if ( subscriptionParentUpdateEditorSettingsHandler ) {
			subscriptionParentUpdateEditorSettingsHandler.remove();
		}

		if ( subscriptionParentUpdateCapabilitiesHandler ) {
			subscriptionParentUpdateCapabilitiesHandler.remove();
		}

		if ( subscriptionParentShowNoticeHandler ) {
			subscriptionParentShowNoticeHandler.remove();
		}

		if ( subscriptionParentShowEditorHelpHandler ) {
			subscriptionParentShowEditorHelpHandler.remove();
		}
	};
}, []);
    const getThemeColorsHandler = useCallback(( { rawStyles, rawFeatures } ) => {
		const { defaultEditorColors, defaultEditorGradients } = props;

		if ( rawStyles && rawFeatures ) {
			return getGlobalStyles( rawStyles, rawFeatures );
		}

		return getColorsAndGradients(
			defaultEditorColors,
			defaultEditorGradients,
			rawFeatures
		);
	}, []);
    useEffect(() => {
		if ( ! prevProps.isReady && props.isReady ) {
			const blocks = props.blocks;
			const isUnsupportedBlock = ( { name } ) =>
				name === getUnregisteredTypeHandlerName();
			const unsupportedBlockNames = blocks
				.filter( isUnsupportedBlock )
				.map( ( block ) => block.attributes.originalName );
			RNReactNativeGutenbergBridge.editorDidMount(
				unsupportedBlockNames
			);
		}
	}, []);
    const serializeToNativeActionHandler = useCallback(() => {
		const title = props.title;
		let html;

		if ( props.mode === 'text' ) {
			// The HTMLTextInput component does not update the store when user is doing changes
			// Let's request the HTML from the component's state directly.
			html = applyFilters( 'native.persist-html' );
		} else {
			html = serialize( props.blocks );
		}

		const hasChanges =
			title !== postHandler.title.raw || html !== postHandler.content.raw;

		// Variable to store the content structure metrics.
		const contentInfo = {};
		contentInfo.characterCount = wordCount(
			html,
			'characters_including_spaces'
		);
		contentInfo.wordCount = wordCount( html, 'words' );
		contentInfo.paragraphCount = props.paragraphCount;
		contentInfo.blockCount = props.blockCount;
		RNReactNativeGutenbergBridge.provideToNative_Html(
			html,
			title,
			hasChanges,
			contentInfo
		);

		if ( hasChanges ) {
			postHandler.title.raw = title;
			postHandler.content.raw = html;
		}
	}, []);
    const updateHtmlActionHandler = useCallback(( html ) => {
		const parsed = parse( html );
		props.resetEditorBlocksWithoutUndoLevel( parsed );
	}, []);
    const replaceBlockActionHandler = useCallback(( html, blockClientId ) => {
		const parsed = parse( html );
		props.replaceBlock( blockClientId, parsed );
	}, []);
    const toggleModeHandler = useCallback(() => {
		const { mode, switchMode } = props;
		// Refresh html content first.
		serializeToNativeActionHandler();
		// Make sure to blur the selected block and dismiss the keyboard.
		props.clearSelectedBlock();
		switchMode( mode === 'visual' ? 'text' : 'visual' );
	}, []);
    const updateCapabilitiesActionHandler = useCallback(( capabilities ) => {
		props.updateSettings( capabilities );
	}, []);

    const { children, post, capabilities, settings, ...props } = props;
		const editorSettings = getEditorSettingsHandler( settings, capabilities );

		return (
			<>
				<EditorProvider
					post={ postHandler }
					settings={ editorSettings }
					{ ...props }
				>
					<SafeAreaProvider>{ children }</SafeAreaProvider>
				</EditorProvider>
				<EditorHelpTopics
					isVisible={ isHelpVisible }
					onClose={ () => setIsHelpVisible(false); }
					close={ () => setIsHelpVisible(false); }
				/>
			</>
		); 
};




export default compose( [
	withSelect( ( select ) => {
		const {
			__unstableIsEditorReady: isEditorReady,
			getEditorBlocks,
			getEditedPostAttribute,
			getEditedPostContent,
		} = select( editorStore );
		const { getEditorMode } = select( editPostStore );

		const {
			getBlockIndex,
			getSelectedBlockClientId,
			getGlobalBlockCount,
			getSettings: getBlockEditorSettings,
		} = select( blockEditorStore );

		const settings = getBlockEditorSettings();
		const defaultEditorColors = settings?.colors ?? [];
		const defaultEditorGradients = settings?.gradients ?? [];

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			mode: getEditorMode(),
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			title: getEditedPostAttribute( 'title' ),
			getEditedPostContent,
			defaultEditorColors,
			defaultEditorGradients,
			selectedBlockIndex: getBlockIndex( selectedBlockClientId ),
			blockCount: getGlobalBlockCount(),
			paragraphCount: getGlobalBlockCount( 'core/paragraph' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, resetEditorBlocks } = dispatch( editorStore );
		const {
			updateSettings,
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		} = dispatch( blockEditorStore );
		const { switchEditorMode } = dispatch( editPostStore );
		const { addEntities, receiveEntityRecords } = dispatch( coreStore );
		const { createSuccessNotice } = dispatch( noticesStore );

		return {
			updateSettings,
			addEntities,
			clearSelectedBlock,
			insertBlock,
			createSuccessNotice,
			editTitle( title ) {
				editPost( { title } );
			},
			receiveEntityRecords,
			resetEditorBlocksWithoutUndoLevel( blocks ) {
				resetEditorBlocks( blocks, {
					__unstableShouldCreateUndoLevel: false,
				} );
			},
			switchMode( mode ) {
				switchEditorMode( mode );
			},
			replaceBlock,
		};
	} ),
] )( NativeEditorProvider );
