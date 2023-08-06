/**
 * External dependencies
 */

import { TouchableWithoutFeedback, View, Text } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { postList as icon } from '@wordpress/icons';
import {
    InspectorControls,
    BlockAlignmentControl,
} from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import {
    Icon,
    PanelBody,
    ToggleControl,
    RangeControl,
    QueryControls,
} from '@wordpress/components';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { MIN_EXCERPT_LENGTH, MAX_EXCERPT_LENGTH } from './constants';

const LatestPostsEdit = (props) => {


    const [categoriesList, setCategoriesList] = useState([]);

    useEffect(() => {
		isStillMountedHandler = true;
		fetchRequestHandler = apiFetch( { path: '/wp/v2/categories' } )
			.then( ( categoriesList ) => {
				if ( isStillMountedHandler ) {
					setCategoriesList(isEmpty( categoriesList )
							? []
							: categoriesList);
				}
			} )
			.catch( () => {
				if ( isStillMountedHandler ) {
					setCategoriesList([]);
				}
			} );
	}, [categoriesList]);
    useEffect(() => {
    return () => {
		isStillMountedHandler = false;
	};
}, []);
    const onSetDisplayPostContentHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { displayPostContent: value } );
	}, []);
    const onSetDisplayPostContentRadioHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( {
			displayPostContentRadio: value ? 'excerpt' : 'full_post',
		} );
	}, []);
    const onSetExcerptLengthHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { excerptLength: value } );
	}, []);
    const onSetDisplayPostDateHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { displayPostDate: value } );
	}, []);
    const onSetDisplayFeaturedImageHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { displayFeaturedImage: value } );
	}, []);
    const onSetAddLinkToFeaturedImageHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { addLinkToFeaturedImage: value } );
	}, []);
    const onSetFeaturedImageAlignHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { featuredImageAlign: value } );
	}, []);
    const onSetOrderHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { order: value } );
	}, []);
    const onSetOrderByHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { orderBy: value } );
	}, []);
    const onSetPostsToShowHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( { postsToShow: value } );
	}, []);
    const onSetCategoriesHandler = useCallback(( value ) => {
		const { setAttributes } = props;
		setAttributes( {
			categories: '' !== value ? value.toString() : undefined,
		} );
	}, []);
    const getInspectorControlsHandler = useCallback(() => {
		const { attributes } = props;
		const {
			displayPostContent,
			displayPostContentRadio,
			excerptLength,
			displayPostDate,
			displayFeaturedImage,
			featuredImageAlign,
			addLinkToFeaturedImage,
			order,
			orderBy,
			postsToShow,
			categories,
		} = attributes;

		
		const displayExcerptPostContent = displayPostContentRadio === 'excerpt';

		return (
			<InspectorControls>
				<PanelBody title={ __( 'Post content settings' ) }>
					<ToggleControl
						label={ __( 'Show post content' ) }
						checked={ displayPostContent }
						onChange={ onSetDisplayPostContentHandler }
					/>
					{ displayPostContent && (
						<ToggleControl
							label={ __( 'Only show excerpt' ) }
							checked={ displayExcerptPostContent }
							onChange={ onSetDisplayPostContentRadioHandler }
						/>
					) }
					{ displayPostContent && displayExcerptPostContent && (
						<RangeControl
							label={ __( 'Excerpt length (words)' ) }
							value={ excerptLength }
							onChange={ onSetExcerptLengthHandler }
							min={ MIN_EXCERPT_LENGTH }
							max={ MAX_EXCERPT_LENGTH }
						/>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Post meta settings' ) }>
					<ToggleControl
						label={ __( 'Display post date' ) }
						checked={ displayPostDate }
						onChange={ onSetDisplayPostDateHandler }
					/>
				</PanelBody>

				<PanelBody title={ __( 'Featured image settings' ) }>
					<ToggleControl
						label={ __( 'Display featured image' ) }
						checked={ displayFeaturedImage }
						onChange={ onSetDisplayFeaturedImageHandler }
					/>
					{ displayFeaturedImage && (
						<>
							<BlockAlignmentControl
								value={ featuredImageAlign }
								onChange={ onSetFeaturedImageAlignHandler }
								controls={ [ 'left', 'center', 'right' ] }
								isBottomSheetControl={ true }
							/>
							<ToggleControl
								label={ __( 'Add link to featured image' ) }
								checked={ addLinkToFeaturedImage }
								onChange={ onSetAddLinkToFeaturedImageHandler }
								separatorType={ 'topFullWidth' }
							/>
						</>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Sorting and filtering' ) }>
					<QueryControls
						{ ...{ order, orderBy } }
						numberOfItems={ postsToShow }
						categoriesList={ categoriesList }
						selectedCategoryId={
							undefined !== categories ? Number( categories ) : ''
						}
						onOrderChange={ onSetOrderHandler }
						onOrderByChange={ onSetOrderByHandler }
						onCategoryChange={
							// eslint-disable-next-line no-undef
							__DEV__ ? onSetCategoriesHandler : undefined
						}
						onNumberOfItemsChange={ onSetPostsToShowHandler }
					/>
				</PanelBody>
			</InspectorControls>
		);
	}, [categoriesList]);

    const {
			blockTitle,
			getStylesFromColorScheme,
			openGeneralSidebar,
			isSelected,
		} = props;

		const blockStyle = getStylesFromColorScheme(
			styles.latestPostBlock,
			styles.latestPostBlockDark
		);

		const iconStyle = getStylesFromColorScheme(
			styles.latestPostBlockIcon,
			styles.latestPostBlockIconDark
		);

		const titleStyle = getStylesFromColorScheme(
			styles.latestPostBlockMessage,
			styles.latestPostBlockMessageDark
		);

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				disabled={ ! isSelected }
				onPress={ openGeneralSidebar }
			>
				<View style={ blockStyle }>
					{ isSelected && getInspectorControlsHandler() }
					<Icon icon={ icon } { ...iconStyle } />
					<Text style={ titleStyle }>{ blockTitle }</Text>
					<Text style={ styles.latestPostBlockSubtitle }>
						{ __( 'CUSTOMIZE' ) }
					</Text>
				</View>
			</TouchableWithoutFeedback>
		); 
};




export default compose( [
	withSelect( ( select, { name } ) => {
		const blockType = select( blocksStore ).getBlockType( name );
		return {
			blockTitle: blockType?.title || name,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { openGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
		};
	} ),
	withPreferredColorScheme,
] )( LatestPostsEdit );
