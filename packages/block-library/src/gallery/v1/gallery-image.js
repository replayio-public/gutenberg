/**
 * External dependencies
 */

import classnames from 'classnames';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';
import { Button, Spinner, ButtonGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { withSelect, withDispatch } from '@wordpress/data';
import {
    RichText,
    MediaPlaceholder,
    store as blockEditorStore
} from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { compose } from '@wordpress/compose';
import {
    closeSmall,
    chevronLeft,
    chevronRight,
    edit,
    image as imageIcon,
} from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { pickRelevantMediaFiles } from './shared';
import {
    LINK_DESTINATION_ATTACHMENT,
    LINK_DESTINATION_MEDIA,
} from './constants';

const isTemporaryImage = ( id, url ) => ! id && isBlobURL( url );

const GalleryImage = (props) => {


    const [isEditing, setIsEditing] = useState(false);

    const bindContainerHandler = useCallback(( ref ) => {
		containerHandler = ref;
	}, []);
    const onSelectImageHandler = useCallback(() => {
		if ( ! props.isSelected ) {
			props.onSelect();
		}
	}, []);
    const onRemoveImageHandler = useCallback(( event ) => {
		if (
			containerHandler === containerHandler.ownerDocument.activeElement &&
			props.isSelected &&
			[ BACKSPACE, DELETE ].indexOf( event.keyCode ) !== -1
		) {
			event.preventDefault();
			props.onRemove();
		}
	}, []);
    const onEditHandler = useCallback(() => {
		setIsEditing(true);
	}, []);
    useEffect(() => {
		const { image, url, __unstableMarkNextChangeAsNotPersistent } =
			props;
		if ( image && ! url ) {
			__unstableMarkNextChangeAsNotPersistent();
			props.setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
			} );
		}
	}, []);
    const deselectOnBlurHandler = useCallback(() => {
		props.onDeselect();
	}, []);
    const onSelectImageFromLibrary = useMemo(() => {
		const { setAttributes, id, url, alt, caption, sizeSlug } = props;
		if ( ! media || ! media.url ) {
			return;
		}

		let mediaAttributes = pickRelevantMediaFiles( media, sizeSlug );

		// If the current image is temporary but an alt text was meanwhile
		// written by the user, make sure the text is not overwritten.
		if ( isTemporaryImage( id, url ) ) {
			if ( alt ) {
				const { alt: omittedAlt, ...restMediaAttributes } =
					mediaAttributes;
				mediaAttributes = restMediaAttributes;
			}
		}

		// If a caption text was meanwhile written by the user,
		// make sure the text is not overwritten by empty captions.
		if ( caption && ! get( mediaAttributes, [ 'caption' ] ) ) {
			const { caption: omittedCaption, ...restMediaAttributes } =
				mediaAttributes;
			mediaAttributes = restMediaAttributes;
		}

		setAttributes( mediaAttributes );
		setIsEditing(false);
	}, []);
    const onSelectCustomURLHandler = useCallback(( newURL ) => {
		const { setAttributes, url } = props;
		if ( newURL !== url ) {
			setAttributes( {
				url: newURL,
				id: undefined,
			} );
			setIsEditing(false);
		}
	}, []);

    const {
			url,
			alt,
			id,
			linkTo,
			link,
			isFirstItem,
			isLastItem,
			isSelected,
			caption,
			onRemove,
			onMoveForward,
			onMoveBackward,
			setAttributes,
			'aria-label': ariaLabel,
		} = props;
		

		let href;

		switch ( linkTo ) {
			case LINK_DESTINATION_MEDIA:
				href = url;
				break;
			case LINK_DESTINATION_ATTACHMENT:
				href = link;
				break;
		}

		const img = (
			// Disable reason: Image itself is not meant to be interactive, but should
			// direct image selection and unfocus caption fields.
			/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
			<>
				<img
					src={ url }
					alt={ alt }
					data-id={ id }
					onKeyDown={ onRemoveImageHandler }
					tabIndex="0"
					aria-label={ ariaLabel }
					ref={ bindContainerHandler }
				/>
				{ isBlobURL( url ) && <Spinner /> }
			</>
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
		);

		const className = classnames( {
			'is-selected': isSelected,
			'is-transient': isBlobURL( url ),
		} );

		return (
			// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
			<figure
				className={ className }
				onClick={ onSelectImageHandler }
				onFocus={ onSelectImageHandler }
			>
				{ ! isEditing && ( href ? <a href={ href }>{ img }</a> : img ) }
				{ isEditing && (
					<MediaPlaceholder
						labels={ { title: __( 'Edit gallery image' ) } }
						icon={ imageIcon }
						onSelect={ onSelectImageFromLibrary }
						onSelectURL={ onSelectCustomURLHandler }
						accept="image/*"
						allowedTypes={ [ 'image' ] }
						value={ { id, src: url } }
					/>
				) }
				<ButtonGroup className="block-library-gallery-item__inline-menu is-left">
					<Button
						icon={ chevronLeft }
						onClick={ isFirstItem ? undefined : onMoveBackward }
						label={ __( 'Move image backward' ) }
						aria-disabled={ isFirstItem }
						disabled={ ! isSelected }
					/>
					<Button
						icon={ chevronRight }
						onClick={ isLastItem ? undefined : onMoveForward }
						label={ __( 'Move image forward' ) }
						aria-disabled={ isLastItem }
						disabled={ ! isSelected }
					/>
				</ButtonGroup>
				<ButtonGroup className="block-library-gallery-item__inline-menu is-right">
					<Button
						icon={ edit }
						onClick={ onEditHandler }
						label={ __( 'Replace image' ) }
						disabled={ ! isSelected }
					/>
					<Button
						icon={ closeSmall }
						onClick={ onRemove }
						label={ __( 'Remove image' ) }
						disabled={ ! isSelected }
					/>
				</ButtonGroup>
				{ ! isEditing && ( isSelected || caption ) && (
					<RichText
						tagName="figcaption"
						className={ __experimentalGetElementClassName(
							'caption'
						) }
						aria-label={ __( 'Image caption text' ) }
						placeholder={ isSelected ? __( 'Add caption' ) : null }
						value={ caption }
						onChange={ ( newCaption ) =>
							setAttributes( { caption: newCaption } )
						}
						inlineToolbar
					/>
				) }
			</figure>
		); 
};




export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getMedia } = select( coreStore );
		const { id } = ownProps;

		return {
			image: id ? getMedia( parseInt( id, 10 ) ) : null,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { __unstableMarkNextChangeAsNotPersistent } =
			dispatch( blockEditorStore );
		return {
			__unstableMarkNextChangeAsNotPersistent,
		};
	} ),
] )( GalleryImage );
