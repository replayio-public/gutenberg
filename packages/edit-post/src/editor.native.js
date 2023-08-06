/**
 * External dependencies
 */

import { map, without } from 'lodash';
import { I18nManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { EditorProvider } from '@wordpress/editor';
import { parse, serialize, store as blocksStore } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
    subscribeSetFocusOnTitle,
    subscribeFeaturedImageIdNativeUpdated,
} from '@wordpress/react-native-bridge';
import { SlotFillProvider } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from './store';

const Editor = (props) => {
const { galleryWithImageBlocks = true } = props;

    

    const getEditorSettingsHandler = useCallback((
		settings,
		hasFixedToolbar,
		focusMode,
		hiddenBlockTypes,
		blockTypes
	) => {
		settings = {
			...settings,
			isRTL: I18nManager.isRTL,
			hasFixedToolbar,
			focusMode,
		};

		// Omit hidden block types if exists and non-empty.
		if ( hiddenBlockTypes.length > 0 ) {
			if ( settings.allowedBlockTypes === undefined ) {
				// If no specific flags for allowedBlockTypes are set, assume `true`
				// meaning allow all block types.
				settings.allowedBlockTypes = true;
			}
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes =
				true === settings.allowedBlockTypes
					? map( blockTypes, 'name' )
					: settings.allowedBlockTypes || [];

			settings.allowedBlockTypes = without(
				defaultAllowedBlockTypes,
				...hiddenBlockTypes
			);
		}

		return settings;
	}, []);
    useEffect(() => {
		const { editEntityRecord, postType, postId } = props;

		subscriptionParentSetFocusOnTitleHandler = subscribeSetFocusOnTitle(
			() => {
				if ( postTitleRefHandler ) {
					postTitleRefHandler.focus();
				} else {
					// If the post title ref is not available, we postpone setting focus to when it's available.
					focusTitleWhenAvailableHandler = true;
				}
			}
		);

		subscriptionParentFeaturedImageIdNativeUpdatedHandler =
			subscribeFeaturedImageIdNativeUpdated( ( payload ) => {
				editEntityRecord(
					'postType',
					postType,
					postId,
					{ featured_media: payload.featuredImageId },
					{
						undoIgnore: true,
					}
				);
			} );
	}, []);
    useEffect(() => {
    return () => {
		if ( subscriptionParentSetFocusOnTitleHandler ) {
			subscriptionParentSetFocusOnTitleHandler.remove();
		}

		if ( subscribeFeaturedImageIdNativeUpdatedHandler ) {
			subscribeFeaturedImageIdNativeUpdatedHandler.remove();
		}
	};
}, []);
    const setTitleRefHandler = useCallback(( titleRef ) => {
		if ( focusTitleWhenAvailableHandler && ! postTitleRefHandler ) {
			focusTitleWhenAvailableHandler = false;
			titleRef.focus();
		}

		postTitleRefHandler = titleRef;
	}, []);

    const {
			settings,
			hasFixedToolbar,
			focusMode,
			initialEdits,
			hiddenBlockTypes,
			blockTypes,
			post,
			postId,
			postType,
			featuredImageId,
			initialHtml,
			...props
		} = props;

		const editorSettings = getEditorSettingsHandler(
			settings,
			hasFixedToolbar,
			focusMode,
			hiddenBlockTypes,
			blockTypes
		);

		const normalizedPost = post || {
			id: postId,
			title: {
				raw: props.initialTitle || '',
			},
			featured_media: featuredImageId,
			content: {
				// Make sure the post content is in sync with gutenberg store
				// to avoid marking the post as modified when simply loaded
				// For now, let's assume: serialize( parse( html ) ) !== html.
				raw: serialize( parse( initialHtml || '' ) ),
			},
			type: postType,
			status: 'draft',
			meta: [],
		};

		return (
			<SlotFillProvider>
				<EditorProvider
					settings={ editorSettings }
					post={ normalizedPost }
					initialEdits={ initialEdits }
					useSubRegistry={ false }
					{ ...props }
				>
					<Layout setTitleRef={ setTitleRefHandler } />
				</EditorProvider>
			</SlotFillProvider>
		); 
};




export default compose( [
	withSelect( ( select ) => {
		const {
			isFeatureActive,
			getEditorMode,
			__experimentalGetPreviewDeviceType,
			getHiddenBlockTypes,
		} = select( editPostStore );
		const { getBlockTypes } = select( blocksStore );

		return {
			hasFixedToolbar:
				isFeatureActive( 'fixedToolbar' ) ||
				__experimentalGetPreviewDeviceType() !== 'Desktop',
			focusMode: isFeatureActive( 'focusMode' ),
			mode: getEditorMode(),
			hiddenBlockTypes: getHiddenBlockTypes(),
			blockTypes: getBlockTypes(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { switchEditorMode } = dispatch( editPostStore );
		const { editEntityRecord } = dispatch( coreStore );
		return {
			switchEditorMode,
			editEntityRecord,
		};
	} ),
] )( Editor );
