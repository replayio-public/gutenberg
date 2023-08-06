/**
 * External dependencies
 */

import { View, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import {
    GlobalStylesContext,
    getMergedGlobalStyles,
    useMobileGlobalStylesColors,
    alignmentHelpers,
    useGlobalStyles,
} from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
    getBlockType,
    __experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
} from '@wordpress/blocks';
import { useSetting } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './block.scss';
import BlockMobileToolbar from '../block-mobile-toolbar';
import { store as blockEditorStore } from '../../store';

const emptyArray = [];
function BlockForType( {
	attributes,
	clientId,
	contentStyle,
	getBlockWidth,
	insertBlocksAfter,
	isSelected,
	mergeBlocks,
	name,
	onBlockFocus,
	onChange,
	onDeleteBlock,
	onReplace,
	parentWidth,
	parentBlockAlignment,
	wrapperProps,
	blockWidth,
	baseGlobalStyles,
} ) {
	const defaultColors = useMobileGlobalStylesColors();
	const fontSizes = useSetting( 'typography.fontSizes' ) || emptyArray;
	const globalStyle = useGlobalStyles();
	const mergedStyle = useMemo( () => {
		return getMergedGlobalStyles(
			baseGlobalStyles,
			globalStyle,
			wrapperProps.style,
			attributes,
			defaultColors,
			name,
			fontSizes
		);
	}, [
		defaultColors,
		globalStyle,
		// I couldn't simply use attributes and wrapperProps.styles as a dependency because they are almost always a new reference.
		// Thanks to the JSON.stringify we check if the value is the same instead of reference.
		JSON.stringify( wrapperProps.style ),
		JSON.stringify(
			pick( attributes, GlobalStylesContext.BLOCK_STYLE_ATTRIBUTES )
		),
	] );

	return (
		<GlobalStylesContext.Provider value={ mergedStyle }>
			<BlockEdit
				name={ name }
				isSelected={ isSelected }
				attributes={ attributes }
				setAttributes={ onChange }
				onFocus={ onBlockFocus }
				onReplace={ onReplace }
				insertBlocksAfter={ insertBlocksAfter }
				mergeBlocks={ mergeBlocks }
				// Block level styles.
				wrapperProps={ wrapperProps }
				// Inherited styles merged with block level styles.
				style={ mergedStyle }
				clientId={ clientId }
				parentWidth={ parentWidth }
				contentStyle={ contentStyle }
				onDeleteBlock={ onDeleteBlock }
				blockWidth={ blockWidth }
				parentBlockAlignment={ parentBlockAlignment }
			/>
			<View onLayout={ getBlockWidth } />
		</GlobalStylesContext.Provider>
	);
}

const BlockListBlock = (props) => {


    const [blockWidth, setBlockWidth] = useState(props.blockWidth - 2 * props.marginHorizontal);

    const onFocusHandler = useCallback(() => {
		const { firstToSelectId, isSelected, onSelect } = props;
		if ( ! isSelected ) {
			onSelect( firstToSelectId );
		}
	}, []);
    const insertBlocksAfterHandler = useCallback(( blocks ) => {
		props.onInsertBlocks( blocks, props.order + 1 );

		if ( blocks[ 0 ] ) {
			// Focus on the first block inserted.
			props.onSelect( blocks[ 0 ].clientId );
		}
	}, []);
    const getBlockWidthHandler = useCallback(( { nativeEvent } ) => {
		const { layout } = nativeEvent;
		
		const layoutWidth = Math.floor( layout.width );

		if ( ! blockWidth || ! layoutWidth ) {
			return;
		}

		if ( blockWidth !== layoutWidth ) {
			setBlockWidth(layoutWidth);
		}
	}, [blockWidth]);
    const getBlockForTypeHandler = useCallback(() => {
		
		return (
			<BlockForType
				{ ...props }
				onBlockFocus={ onFocusHandler }
				insertBlocksAfter={ insertBlocksAfterHandler }
				getBlockWidth={ getBlockWidthHandler }
				blockWidth={ blockWidth }
			/>
		);
	}, [blockWidth]);
    const renderBlockTitleHandler = useCallback(() => {
		return (
			<View style={ styles.blockTitle }>
				<Text>BlockType: { props.name }</Text>
			</View>
		);
	}, []);

    const {
			attributes,
			blockType,
			clientId,
			icon,
			isSelected,
			isValid,
			order,
			title,
			isDimmed,
			isTouchable,
			onDeleteBlock,
			isStackedHorizontally,
			isParentSelected,
			getStylesFromColorScheme,
			marginVertical,
			marginHorizontal,
			isInnerBlockSelected,
			name,
			draggingEnabled,
			draggingClientId,
		} = props;

		if ( ! attributes || ! blockType ) {
			return null;
		}
		
		const { align } = attributes;
		const accessibilityLabel = getAccessibleBlockLabel(
			blockType,
			attributes,
			order + 1
		);
		const { isFullWidth, isContainerRelated } = alignmentHelpers;
		const accessible = ! ( isSelected || isInnerBlockSelected );
		const screenWidth = Math.floor( Dimensions.get( 'window' ).width );
		const isScreenWidthEqual = blockWidth === screenWidth;
		const isScreenWidthWider = blockWidth < screenWidth;
		const isFullWidthToolbar = isFullWidth( align ) || isScreenWidthEqual;

		return (
			<TouchableWithoutFeedback
				onPress={ onFocusHandler }
				accessible={ accessible }
				accessibilityRole={ 'button' }
			>
				<View
					style={ { flex: 1 } }
					accessibilityLabel={ accessibilityLabel }
				>
					<View
						pointerEvents={ isTouchable ? 'auto' : 'box-only' }
						accessibilityLabel={ accessibilityLabel }
						style={ [
							{ marginVertical, marginHorizontal, flex: 1 },
							isDimmed && styles.dimmed,
						] }
					>
						{ isSelected && (
							<View
								pointerEvents="box-none"
								style={ [
									styles.solidBorder,
									isFullWidth( align ) &&
										isScreenWidthWider &&
										styles.borderFullWidth,
									isFullWidth( align ) &&
										isContainerRelated( name ) &&
										isScreenWidthWider &&
										styles.containerBorderFullWidth,
									getStylesFromColorScheme(
										styles.solidBorderColor,
										styles.solidBorderColorDark
									),
								] }
							/>
						) }
						{ isParentSelected && (
							<View
								style={ [
									styles.dashedBorder,
									getStylesFromColorScheme(
										styles.dashedBorderColor,
										styles.dashedBorderColorDark
									),
								] }
							/>
						) }
						<BlockDraggable
							clientId={ clientId }
							draggingClientId={ draggingClientId }
							enabled={ draggingEnabled }
							testID="draggable-trigger-content"
						>
							{ () =>
								isValid ? (
									getBlockForTypeHandler()
								) : (
									<BlockInvalidWarning
										blockTitle={ title }
										icon={ icon }
										clientId={ clientId }
									/>
								)
							}
						</BlockDraggable>
						<View
							style={ styles.neutralToolbar }
							ref={ anchorNodeRefHandler }
						>
							{ isSelected && (
								<BlockMobileToolbar
									clientId={ clientId }
									onDelete={ onDeleteBlock }
									isStackedHorizontally={
										isStackedHorizontally
									}
									blockWidth={ blockWidth }
									anchorNodeRef={ anchorNodeRefHandler.current }
									isFullWidth={ isFullWidthToolbar }
									draggingClientId={ draggingClientId }
								/>
							) }
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		); 
};




// Helper function to memoize the wrapperProps since getEditWrapperProps always returns a new reference.
const wrapperPropsCache = new WeakMap();
const emptyObj = {};
function getWrapperProps( value, getWrapperPropsFunction ) {
	if ( ! getWrapperPropsFunction ) {
		return emptyObj;
	}
	const cachedValue = wrapperPropsCache.get( value );
	if ( ! cachedValue ) {
		const wrapperProps = getWrapperPropsFunction( value );
		wrapperPropsCache.set( value, wrapperProps );
		return wrapperProps;
	}
	return cachedValue;
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockIndex,
			getBlockCount,
			getSettings,
			isBlockSelected,
			getBlock,
			getSelectedBlockClientId,
			getLowestCommonAncestorWithSelectedBlock,
			getBlockParents,
			hasSelectedInnerBlock,
			getBlockHierarchyRootClientId,
		} = select( blockEditorStore );

		const order = getBlockIndex( clientId );
		const isSelected = isBlockSelected( clientId );
		const isInnerBlockSelected = hasSelectedInnerBlock( clientId );
		const block = getBlock( clientId );
		const { name, attributes, isValid } = block || {};

		const blockType = getBlockType( name || 'core/missing' );
		const title = blockType?.title;
		const icon = blockType?.icon;

		const parents = getBlockParents( clientId, true );
		const parentId = parents[ 0 ] || '';

		const selectedBlockClientId = getSelectedBlockClientId();

		const commonAncestor =
			getLowestCommonAncestorWithSelectedBlock( clientId );
		const commonAncestorIndex = parents.indexOf( commonAncestor ) - 1;
		const firstToSelectId = commonAncestor
			? parents[ commonAncestorIndex ]
			: parents[ parents.length - 1 ];

		const isParentSelected =
			// Set false as a default value to prevent re-render when it's changed from null to false.
			( selectedBlockClientId || false ) &&
			selectedBlockClientId === parentId;

		const selectedParents = selectedBlockClientId
			? getBlockParents( selectedBlockClientId )
			: [];
		const isDescendantOfParentSelected =
			selectedParents.includes( parentId );
		const isTouchable =
			isSelected ||
			isDescendantOfParentSelected ||
			isParentSelected ||
			parentId === '';
		const baseGlobalStyles =
			getSettings()?.__experimentalGlobalStylesBaseStyles;

		const hasInnerBlocks = getBlockCount( clientId ) > 0;
		// For blocks with inner blocks, we only enable the dragging in the nested
		// blocks if any of them are selected. This way we prevent the long-press
		// gesture from being disabled for elements within the block UI.
		const draggingEnabled =
			! hasInnerBlocks ||
			isSelected ||
			! hasSelectedInnerBlock( clientId, true );
		// Dragging nested blocks is not supported yet. For this reason, the block to be dragged
		// will be the top in the hierarchy.
		const draggingClientId = getBlockHierarchyRootClientId( clientId );

		return {
			icon,
			name: name || 'core/missing',
			order,
			title,
			attributes,
			blockType,
			draggingClientId,
			draggingEnabled,
			isSelected,
			isInnerBlockSelected,
			isValid,
			isParentSelected,
			firstToSelectId,
			isTouchable,
			baseGlobalStyles,
			wrapperProps: getWrapperProps(
				attributes,
				blockType.getEditWrapperProps
			),
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			insertBlocks,
			mergeBlocks,
			replaceBlocks,
			selectBlock,
			updateBlockAttributes,
		} = dispatch( blockEditorStore );

		return {
			mergeBlocks( forward ) {
				const { clientId } = ownProps;
				const { getPreviousBlockClientId, getNextBlockClientId } =
					select( blockEditorStore );

				if ( forward ) {
					const nextBlockClientId = getNextBlockClientId( clientId );
					if ( nextBlockClientId ) {
						mergeBlocks( clientId, nextBlockClientId );
					}
				} else {
					const previousBlockClientId =
						getPreviousBlockClientId( clientId );
					if ( previousBlockClientId ) {
						mergeBlocks( previousBlockClientId, clientId );
					}
				}
			},
			onInsertBlocks( blocks, index ) {
				insertBlocks( blocks, index, ownProps.rootClientId );
			},
			onSelect( clientId = ownProps.clientId, initialPosition ) {
				selectBlock( clientId, initialPosition );
			},
			onChange: ( attributes ) => {
				updateBlockAttributes( ownProps.clientId, attributes );
			},
			onReplace( blocks, indexToSelect ) {
				replaceBlocks( [ ownProps.clientId ], blocks, indexToSelect );
			},
		};
	} ),
	withPreferredColorScheme,
] )( BlockListBlock );
