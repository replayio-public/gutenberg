/**
 * External dependencies
 */

import { View, Platform, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useCallback, createContext } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import {
    KeyboardAwareFlatList,
    ReadableContentView,
    WIDE_ALIGNMENTS,
    alignmentHelpers,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListItem from './block-list-item';
import BlockListItemCell from './block-list-item-cell';
import {
    BlockListProvider,
    BlockListConsumer,
    DEFAULT_BLOCK_LIST_CONTEXT,
} from './block-list-context';
import { BlockDraggableWrapper } from '../block-draggable';
import { store as blockEditorStore } from '../../store';

export const OnCaretVerticalPositionChange = createContext();
const identity = ( x ) => x;

const stylesMemo = {};
const getStyles = (
	isRootList,
	isStackedHorizontally,
	horizontalAlignment
) => {
	if ( isRootList ) {
		return;
	}
	const styleName = `${ isStackedHorizontally }-${ horizontalAlignment }`;
	if ( stylesMemo[ styleName ] ) {
		return stylesMemo[ styleName ];
	}
	const computedStyles = [
		isStackedHorizontally && styles.horizontal,
		horizontalAlignment && styles[ `is-aligned-${ horizontalAlignment }` ],
		styles.overflowVisible,
	];
	stylesMemo[ styleName ] = computedStyles;
	return computedStyles;
};

export export const BlockList = (props) => {


    const [blockWidth, setBlockWidth] = useState(props.blockWidth || 0);

    const addBlockToEndOfPostHandler = useCallback(( newBlock ) => {
		props.insertBlock( newBlock, props.blockCount );
	}, []);
    const onCaretVerticalPositionChangeHandler = useCallback(( targetId, caretY, previousCaretY ) => {
		KeyboardAwareFlatList.handleCaretVerticalPositionChange(
			scrollViewRefHandler,
			targetId,
			caretY,
			previousCaretY
		);
	}, []);
    const scrollViewInnerRefHandler = useCallback(( ref ) => {
		scrollViewRefHandler = ref;
	}, []);
    const shouldFlatListPreventAutomaticScrollHandler = useCallback(() => {
		return props.isBlockInsertionPointVisible;
	}, []);
    const shouldShowInnerBlockAppenderHandler = useCallback(() => {
		const { blockClientIds, renderAppender } = props;
		return renderAppender && blockClientIds.length > 0;
	}, []);
    const renderEmptyListHandler = useCallback(() => {
		return (
			<EmptyListComponentCompose
				rootClientId={ props.rootClientId }
				renderAppender={ props.renderAppender }
				renderFooterAppender={ props.renderFooterAppender }
			/>
		);
	}, []);
    const getExtraDataHandler = useCallback(() => {
		const {
			parentWidth,
			renderFooterAppender,
			onDeleteBlock,
			contentStyle,
			renderAppender,
			gridProperties,
		} = props;
		
		if (
			extraDataHandler.parentWidth !== parentWidth ||
			extraDataHandler.renderFooterAppender !== renderFooterAppender ||
			extraDataHandler.onDeleteBlock !== onDeleteBlock ||
			extraDataHandler.contentStyle !== contentStyle ||
			extraDataHandler.renderAppender !== renderAppender ||
			extraDataHandler.blockWidth !== blockWidth ||
			extraDataHandler.gridProperties !== gridProperties
		) {
			extraDataHandler = {
				parentWidth,
				renderFooterAppender,
				onDeleteBlock,
				contentStyle,
				renderAppender,
				blockWidth,
				gridProperties,
			};
		}
		return extraDataHandler;
	}, [blockWidth]);
    const getCellRendererComponentHandler = useCallback(( { children, item, onLayout } ) => {
		const { rootClientId } = props;
		return (
			<BlockListItemCell
				children={ children }
				clientId={ item }
				onLayout={ onLayout }
				rootClientId={ rootClientId }
			/>
		);
	}, []);
    const onLayoutHandler = useCallback(( { nativeEvent } ) => {
		const { layout } = nativeEvent;
		
		const { isRootList, maxWidth } = props;

		const layoutWidth = Math.floor( layout.width );
		if ( isRootList && blockWidth !== layoutWidth ) {
			setBlockWidth(Math.min( layoutWidth, maxWidth ));
		} else if ( ! isRootList && ! blockWidth ) {
			setBlockWidth(Math.min( layoutWidth, maxWidth ));
		}
	}, [blockWidth]);
    const renderListHandler = useCallback(( extraProps = {} ) => {
		const {
			clearSelectedBlock,
			blockClientIds,
			title,
			header,
			isReadOnly,
			isRootList,
			horizontal,
			marginVertical = styles.defaultBlock.marginTop,
			marginHorizontal = styles.defaultBlock.marginLeft,
			isFloatingToolbarVisible,
			isStackedHorizontally,
			horizontalAlignment,
			contentResizeMode,
			blockWidth,
		} = props;
		const { parentScrollRef, onScroll } = extraProps;

		const { blockToolbar, blockBorder, headerToolbar, floatingToolbar } =
			styles;

		const containerStyle = {
			flex: isRootList ? 1 : 0,
			// We set negative margin in the parent to remove the edge spacing between parent block and child block in ineer blocks.
			marginVertical: isRootList ? 0 : -marginVertical,
			marginHorizontal: isRootList ? 0 : -marginHorizontal,
		};

		const isContentStretch = contentResizeMode === 'stretch';
		const isMultiBlocks = blockClientIds.length > 1;
		const { isWider } = alignmentHelpers;

		return (
			<View
				style={ containerStyle }
				onAccessibilityEscape={ clearSelectedBlock }
				onLayout={ onLayoutHandler }
				testID="block-list-wrapper"
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android'
						? { removeClippedSubviews: false }
						: {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					autoScroll={ props.autoScroll }
					innerRef={ ( ref ) => {
						scrollViewInnerRefHandler( parentScrollRef || ref );
					} }
					extraScrollHeight={
						blockToolbar.height + blockBorder.width
					}
					inputAccessoryViewHeight={
						headerToolbar.height +
						( isFloatingToolbarVisible
							? floatingToolbar.height
							: 0 )
					}
					keyboardShouldPersistTaps="always"
					scrollViewStyle={ [
						{ flex: isRootList ? 1 : 0 },
						! isRootList && styles.overflowVisible,
					] }
					extraData={ getExtraDataHandler() }
					scrollEnabled={ isRootList }
					contentContainerStyle={ [
						horizontal && styles.horizontalContentContainer,
						isWider( blockWidth, 'medium' ) &&
							( isContentStretch && isMultiBlocks
								? styles.horizontalContentContainerStretch
								: styles.horizontalContentContainerCenter ),
					] }
					style={ getStyles(
						isRootList,
						isStackedHorizontally,
						horizontalAlignment
					) }
					data={ blockClientIds }
					keyExtractor={ identity }
					renderItem={ renderItemHandler }
					CellRendererComponent={ getCellRendererComponentHandler }
					shouldPreventAutomaticScroll={
						shouldFlatListPreventAutomaticScrollHandler
					}
					title={ title }
					ListHeaderComponent={ header }
					ListEmptyComponent={ ! isReadOnly && renderEmptyListHandler }
					ListFooterComponent={ renderBlockListFooterHandler }
					onScroll={ onScroll }
				/>
				{ shouldShowInnerBlockAppenderHandler() && (
					<View
						style={ {
							marginHorizontal:
								marginHorizontal -
								styles.innerAppender.marginLeft,
						} }
					>
						<BlockListAppender
							rootClientId={ props.rootClientId }
							renderAppender={ props.renderAppender }
							showSeparator
						/>
					</View>
				) }
			</View>
		);
	}, [blockWidth]);
    const renderItemHandler = useCallback(( { item: clientId } ) => {
		const {
			contentResizeMode,
			contentStyle,
			onAddBlock,
			onDeleteBlock,
			rootClientId,
			isStackedHorizontally,
			blockClientIds,
			parentWidth,
			marginVertical = styles.defaultBlock.marginTop,
			marginHorizontal = styles.defaultBlock.marginLeft,
			gridProperties,
		} = props;
		

		// Extracting the grid item properties here to avoid
		// re-renders in the blockListItem component.
		const isGridItem = !! gridProperties;
		const gridItemProps = gridProperties && {
			numOfColumns: gridProperties.numColumns,
			tileCount: blockClientIds.length,
			tileIndex: blockClientIds.indexOf( clientId ),
		};
		return (
			<BlockListItem
				isStackedHorizontally={ isStackedHorizontally }
				rootClientId={ rootClientId }
				clientId={ clientId }
				parentWidth={ parentWidth }
				contentResizeMode={ contentResizeMode }
				contentStyle={ contentStyle }
				onAddBlock={ onAddBlock }
				marginVertical={ marginVertical }
				marginHorizontal={ marginHorizontal }
				onDeleteBlock={ onDeleteBlock }
				shouldShowInnerBlockAppender={
					shouldShowInnerBlockAppenderHandler
				}
				blockWidth={ blockWidth }
				isGridItem={ isGridItem }
				{ ...gridItemProps }
			/>
		);
	}, [blockWidth]);
    const renderBlockListFooterHandler = useCallback(() => {
		const paragraphBlock = createBlock( 'core/paragraph' );
		const {
			isReadOnly,
			withFooter = true,
			renderFooterAppender,
		} = props;

		if ( ! isReadOnly && withFooter ) {
			return (
				<>
					<TouchableWithoutFeedback
						accessibilityLabel={ __( 'Add paragraph block' ) }
						testID={ __( 'Add paragraph block' ) }
						onPress={ () => {
							addBlockToEndOfPostHandler( paragraphBlock );
						} }
					>
						<View style={ styles.blockListFooter } />
					</TouchableWithoutFeedback>
				</>
			);
		} else if ( renderFooterAppender ) {
			return renderFooterAppender();
		}
		return null;
	}, []);

    const { isRootList, isRTL } = props;
		// Use of Context to propagate the main scroll ref to its children e.g InnerBlocks.
		const blockList = isRootList ? (
			<BlockListProvider
				value={ {
					...DEFAULT_BLOCK_LIST_CONTEXT,
					scrollRef: scrollViewRefHandler,
				} }
			>
				<BlockDraggableWrapper isRTL={ isRTL }>
					{ ( { onScroll } ) => renderListHandler( { onScroll } ) }
				</BlockDraggableWrapper>
			</BlockListProvider>
		) : (
			<BlockListConsumer>
				{ ( { scrollRef } ) =>
					renderListHandler( {
						parentScrollRef: scrollRef,
					} )
				}
			</BlockListConsumer>
		);

		return (
			<OnCaretVerticalPositionChange.Provider
				value={ onCaretVerticalPositionChangeHandler }
			>
				{ blockList }
			</OnCaretVerticalPositionChange.Provider>
		); 
};




export default compose( [
	withSelect(
		( select, { rootClientId, orientation, filterInnerBlocks } ) => {
			const {
				getBlockCount,
				getBlockOrder,
				getSelectedBlockClientId,
				isBlockInsertionPointVisible,
				getSettings,
			} = select( blockEditorStore );

			const isStackedHorizontally = orientation === 'horizontal';

			const selectedBlockClientId = getSelectedBlockClientId();

			let blockClientIds = getBlockOrder( rootClientId );
			// Display only block which fulfill the condition in passed `filterInnerBlocks` function.
			if ( filterInnerBlocks ) {
				blockClientIds = filterInnerBlocks( blockClientIds );
			}

			const { maxWidth } = getSettings();
			const isReadOnly = getSettings().readOnly;

			const blockCount = getBlockCount();
			const hasRootInnerBlocks = !! blockCount;

			const isFloatingToolbarVisible =
				!! selectedBlockClientId && hasRootInnerBlocks;
			const isRTL = getSettings().isRTL;

			return {
				blockClientIds,
				blockCount,
				isBlockInsertionPointVisible:
					Platform.OS === 'ios' && isBlockInsertionPointVisible(),
				isReadOnly,
				isRootList: rootClientId === undefined,
				isFloatingToolbarVisible,
				isStackedHorizontally,
				maxWidth,
				isRTL,
			};
		}
	),
	withDispatch( ( dispatch ) => {
		const { insertBlock, replaceBlock, clearSelectedBlock } =
			dispatch( blockEditorStore );

		return {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		};
	} ),
	withPreferredColorScheme,
] )( BlockList );

const EmptyListComponent = (props) => {


    

    

    const {
			shouldShowInsertionPoint,
			rootClientId,
			renderAppender,
			renderFooterAppender,
		} = props;

		if ( renderFooterAppender || renderAppender === false ) {
			return null;
		}

		return (
			<View style={ styles.defaultAppender }>
				<ReadableContentView
					align={
						renderAppender
							? WIDE_ALIGNMENTS.alignments.full
							: undefined
					}
				>
					<BlockListAppender
						rootClientId={ rootClientId }
						renderAppender={ renderAppender }
						showSeparator={ shouldShowInsertionPoint }
					/>
				</ReadableContentView>
			</View>
		); 
};




const EmptyListComponentCompose = compose( [
	withSelect( ( select, { rootClientId, orientation } ) => {
		const {
			getBlockOrder,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = select( blockEditorStore );

		const isStackedHorizontally = orientation === 'horizontal';
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const shouldShowInsertionPoint =
			! isStackedHorizontally &&
			blockInsertionPointIsVisible &&
			insertionPoint.rootClientId === rootClientId &&
			// If list is empty, show the insertion point (via the default appender)
			( blockClientIds.length === 0 ||
				// Or if the insertion point is right before the denoted block.
				! blockClientIds[ insertionPoint.index ] );

		return {
			shouldShowInsertionPoint,
		};
	} ),
] )( EmptyListComponent );
