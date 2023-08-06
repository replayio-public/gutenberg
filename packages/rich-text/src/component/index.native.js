/* eslint no-console: ["error", { allow: ["warn"] }] */

/**
 * External dependencies
 */

import { View, Dimensions } from 'react-native';
import memize from 'memize';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import { BlockFormatControls, getPxFromCssUnit } from '@wordpress/block-editor';
import { useState, useCallback, useEffect } from '@wordpress/element';
import {
    compose, withPreferredColorScheme
} from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { childrenBlock } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import { isURL } from '@wordpress/url';
import { atSymbol, plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useFormatTypes } from './use-format-types';
import { applyFormat } from '../apply-format';
import { getActiveFormat } from '../get-active-format';
import { getActiveFormats } from '../get-active-formats';
import { insert } from '../insert';
import { getTextContent } from '../get-text-content';
import { isEmpty, isEmptyLine } from '../is-empty';
import { create } from '../create';
import { toHTMLString } from '../to-html-string';
import { removeLineSeparator } from '../remove-line-separator';
import { isCollapsed } from '../is-collapsed';
import { remove } from '../remove';
import { getFormatColors } from '../get-format-colors';
import styles from './style.scss';
import ToolbarButtonWithOptions from './toolbar-button-with-options';

const unescapeSpaces = ( text ) => {
	return text.replace( /&nbsp;|&#160;/gi, ' ' );
};

// The flattened color palettes array is memoized to ensure that the same array instance is
// returned for the colors palettes. This value might be used as a prop, so having the same
// instance will prevent unnecessary re-renders of the RichText component.
const flatColorPalettes = memize( ( colorsPalettes ) => [
	...( colorsPalettes?.theme || [] ),
	...( colorsPalettes?.custom || [] ),
	...( colorsPalettes?.default || [] ),
] );

const gutenbergFormatNamesToAztec = {
	'core/bold': 'bold',
	'core/italic': 'italic',
	'core/strikethrough': 'strikethrough',
	'core/text-color': 'mark',
};

const EMPTY_PARAGRAPH_TAGS = '<p></p>';
const DEFAULT_FONT_SIZE = 16;
const MIN_LINE_HEIGHT = 1;

export export const RichText = (props) => {


    const [activeFormats, setActiveFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [height, setHeight] = useState(0);
    const [currentFontSize, setCurrentFontSize] = useState(getFontSizeHandler( arguments[ 0 ] ));
    const [currentFontSize, setCurrentFontSize] = useState();

    /**
	 * Get the current record (value and selection) from props and state.
	 *
	 * @return {Object} The current record (value and selection).
	 */
    const getRecordHandler = useCallback(() => {
		const {
			selectionStart: start,
			selectionEnd: end,
			colorPalette,
		} = props;
		const { value } = props;
		const currentValue = formatToValueHandler( value );

		const { formats, replacements, text } = currentValue;
		
		const newFormats = getFormatColors( value, formats, colorPalette );

		return {
			formats: newFormats,
			replacements,
			text,
			start,
			end,
			activeFormats,
		};
	}, []);
    /**
	 * Creates a RichText value "record" from the current content and selection
	 * information
	 *
	 *
	 * @return {Object} A RichText value with formats and selection.
	 */
    const createRecordHandler = useCallback(() => {
		const { preserveWhiteSpace } = props;
		const value = {
			start: selectionStartHandler,
			end: selectionEndHandler,
			...create( {
				html: valueHandler,
				range: null,
				multilineTag: multilineTagHandler,
				multilineWrapperTags: multilineWrapperTagsHandler,
				preserveWhiteSpace,
			} ),
		};
		const start = Math.min( selectionStartHandler, value.text.length );
		const end = Math.min( selectionEndHandler, value.text.length );
		return { ...value, start, end };
	}, []);
    const valueToFormatHandler = useCallback(( value ) => {
		// Remove the outer root tags.
		return removeRootTagsProduceByAztecHandler(
			toHTMLString( {
				value,
				multilineTag: multilineTagHandler,
			} )
		);
	}, []);
    const getActiveFormatNamesHandler = useCallback(( record ) => {
		const { formatTypes } = props;

		return formatTypes
			.map( ( { name } ) => name )
			.filter( ( name ) => {
				return getActiveFormat( record, name ) !== undefined;
			} )
			.map( ( name ) => gutenbergFormatNamesToAztec[ name ] )
			.filter( Boolean );
	}, []);
    const onFormatChangeHandler = useCallback(( record ) => {
		const { start = 0, end = 0, activeFormats = [] } = record;
		const changeHandlers = Object.fromEntries(
			Object.entries( props ).filter( ( [ key ] ) =>
				key.startsWith( 'format_on_change_functions_' )
			)
		);

		Object.values( changeHandlers ).forEach( ( changeHandler ) => {
			changeHandler( record.formats, record.text );
		} );

		valueHandler = valueToFormatHandler( record );
		props.onChange( valueHandler );
		setActiveFormats(activeFormats);
		props.onSelectionChange( start, end );
		selectionStartHandler = start;
		selectionEndHandler = end;

		onCreateUndoLevelHandler();

		lastAztecEventTypeHandler = 'format change';
	}, [activeFormats]);
    const insertStringHandler = useCallback(( record, string ) => {
		if ( record && string ) {
			manipulateEventCounterToForceNativeToRefreshHandler(); // force a refresh on the native side
			const toInsert = insert( record, string );
			onFormatChangeHandler( toInsert );
		}
	}, []);
    const onCreateUndoLevelHandler = useCallback(() => {
		const { __unstableOnCreateUndoLevel: onCreateUndoLevel } = props;
		// If the content is the same, no level needs to be created.
		if ( lastHistoryValueHandler === valueHandler ) {
			return;
		}

		onCreateUndoLevel();
		lastHistoryValueHandler = valueHandler;
	}, []);
    /*
	 * Cleans up any root tags produced by aztec.
	 * TODO: This should be removed on a later version when aztec doesn't return the top tag of the text being edited
	 */
    const removeRootTagsProduceByAztecHandler = useCallback(( html ) => {
		let result = removeRootTagHandler( props.tagName, html );
		// Temporary workaround for https://github.com/WordPress/gutenberg/pull/13763
		if ( props.rootTagsToEliminate ) {
			props.rootTagsToEliminate.forEach( ( element ) => {
				result = removeRootTagHandler( element, result );
			} );
		}

		if ( props.tagsToEliminate ) {
			props.tagsToEliminate.forEach( ( element ) => {
				result = removeTagHandler( element, result );
			} );
		}
		return result;
	}, []);
    const removeRootTagHandler = useCallback(( tag, html ) => {
		const openingTagRegexp = RegExp( '^<' + tag + '[^>]*>', 'gim' );
		const closingTagRegexp = RegExp( '</' + tag + '>$', 'gim' );
		return html
			.replace( openingTagRegexp, '' )
			.replace( closingTagRegexp, '' );
	}, []);
    const removeTagHandler = useCallback(( tag, html ) => {
		const openingTagRegexp = RegExp( '<' + tag + '>', 'gim' );
		const closingTagRegexp = RegExp( '</' + tag + '>', 'gim' );
		return html
			.replace( openingTagRegexp, '' )
			.replace( closingTagRegexp, '' );
	}, []);
    /*
	 * Handles any case where the content of the AztecRN instance has changed
	 */
    const onChangeFromAztecHandler = useCallback(( event ) => {
		if ( shouldDropEventFromAztecHandler( event, 'onChange' ) ) {
			return;
		}

		const contentWithoutRootTag = removeRootTagsProduceByAztecHandler(
			unescapeSpaces( event.nativeEvent.text )
		);
		// On iOS, onChange can be triggered after selection changes, even though there are no content changes.
		if ( contentWithoutRootTag === valueHandler ) {
			return;
		}
		lastEventCountHandler = event.nativeEvent.eventCount;
		comesFromAztecHandler = true;
		firedAfterTextChangedHandler = true; // The onChange event always fires after the fact.
		onTextUpdateHandler( event );
		lastAztecEventTypeHandler = 'input';
	}, []);
    const onTextUpdateHandler = useCallback(( event ) => {
		const contentWithoutRootTag = removeRootTagsProduceByAztecHandler(
			unescapeSpaces( event.nativeEvent.text )
		);
		let formattedContent = contentWithoutRootTag;
		if ( ! isIOSHandler ) {
			formattedContent = restoreParagraphTagsHandler(
				contentWithoutRootTag,
				multilineTagHandler
			);
		}

		debounceCreateUndoLevelHandler();
		const refresh = valueHandler !== formattedContent;
		valueHandler = formattedContent;

		// We don't want to refresh if our goal is just to create a record.
		if ( refresh ) {
			props.onChange( formattedContent );
		}
	}, []);
    const restoreParagraphTagsHandler = useCallback(( value, tag ) => {
		if ( tag === 'p' && ( ! value || ! value.startsWith( '<p>' ) ) ) {
			return '<p>' + value + '</p>';
		}
		return value;
	}, []);
    /*
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */
    const onContentSizeChangeHandler = useCallback(( contentSize ) => {
		setStateHandler( contentSize );
		lastAztecEventTypeHandler = 'content size change';
	}, []);
    const onKeyDownHandler = useCallback(( event ) => {
		if ( event.defaultPrevented ) {
			return;
		}

		// Add stubs for conformance in downstream autocompleters logic.
		customEditableOnKeyDownHandler?.( {
			preventDefault: () => undefined,
			...event,
		} );

		handleDeleteHandler( event );
		handleEnterHandler( event );
		handleTriggerKeyCodesHandler( event );
	}, []);
    const handleEnterHandler = useCallback(( event ) => {
		if ( event.keyCode !== ENTER ) {
			return;
		}
		const { onEnter } = props;

		if ( ! onEnter ) {
			return;
		}

		onEnter( {
			value: createRecordHandler(),
			onChange: onFormatChangeHandler,
			shiftKey: event.shiftKey,
		} );
		lastAztecEventTypeHandler = 'input';
	}, []);
    const handleDeleteHandler = useCallback(( event ) => {
		if ( shouldDropEventFromAztecHandler( event, 'handleDelete' ) ) {
			return;
		}

		const { keyCode } = event;

		if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
			return;
		}
		const isReverse = keyCode === BACKSPACE;

		const { onDelete, __unstableMultilineTag: multilineTag } = props;
		lastEventCountHandler = event.nativeEvent.eventCount;
		comesFromAztecHandler = true;
		firedAfterTextChangedHandler = event.nativeEvent.firedAfterTextChanged;
		const value = createRecordHandler();
		const { start, end, text } = value;
		let newValue;

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end >= text.length ) {
			newValue = remove( value );
			onFormatChangeHandler( newValue );
			event.preventDefault();
			return;
		}

		if ( multilineTag ) {
			if (
				isReverse &&
				value.start === 0 &&
				value.end === 0 &&
				isEmptyLine( value )
			) {
				newValue = removeLineSeparator( value, ! isReverse );
			} else {
				newValue = removeLineSeparator( value, isReverse );
			}
			if ( newValue ) {
				onFormatChangeHandler( newValue );
				event.preventDefault();
				return;
			}
		}

		// Only process delete if the key press occurs at an uncollapsed edge.
		if (
			! onDelete ||
			! isCollapsed( value ) ||
			( isReverse && start !== 0 ) ||
			( ! isReverse && end !== text.length )
		) {
			return;
		}

		onDelete( { isReverse, value } );

		event.preventDefault();
		lastAztecEventTypeHandler = 'input';
	}, []);
    const handleTriggerKeyCodesHandler = useCallback(( event ) => {
		const { keyCode } = event;
		const triggeredOption = suggestionOptionsHandler().find( ( option ) => {
			const triggeredKeyCode = option.triggerChar.charCodeAt( 0 );
			return triggeredKeyCode === keyCode;
		} );

		if ( triggeredOption ) {
			const record = getRecordHandler();
			const text = getTextContent( record );
			// Only respond to the trigger if the selection is on the start of text or line
			// or if the character before is a space.
			const useTrigger =
				text.length === 0 ||
				record.start === 0 ||
				text.charAt( record.start - 1 ) === '\n' ||
				text.charAt( record.start - 1 ) === ' ';

			if ( useTrigger && triggeredOption.onClick ) {
				triggeredOption.onClick();
			} else {
				insertStringHandler( record, triggeredOption.triggerChar );
			}
		}
	}, []);
    const suggestionOptionsHandler = useCallback(() => {
		const { areMentionsSupported, areXPostsSupported } = props;
		const allOptions = [
			{
				supported: areMentionsSupported,
				title: __( 'Insert mention' ),
				onClick: handleUserSuggestionHandler,
				triggerChar: '@',
				value: 'mention',
				label: __( 'Mention' ),
				icon: atSymbol,
			},
			{
				supported: areXPostsSupported,
				title: __( 'Insert crosspost' ),
				onClick: handleXpostSuggestionHandler,
				triggerChar: '+',
				value: 'crosspost',
				label: __( 'Crosspost' ),
				icon: plus,
			},
		];
		return allOptions.filter( ( op ) => op.supported );
	}, []);
    const handleSuggestionFuncHandler = useCallback(( suggestionFunction, prefix ) => {
		return () => {
			const record = getRecordHandler();
			suggestionFunction()
				.then( ( suggestion ) => {
					insertStringHandler( record, `${ prefix }${ suggestion } ` );
				} )
				.catch( () => {} );
		};
	}, []);
    /**
	 * Handles a paste event from the native Aztec Wrapper.
	 *
	 * @param {Object} event The paste event which wraps `nativeEvent`.
	 */
    const onPasteHandler = useCallback(( event ) => {
		const { onPaste, onChange } = props;
		

		const { pastedText, pastedHtml, files } = event.nativeEvent;
		const currentRecord = createRecordHandler();

		event.preventDefault();

		// There is a selection, check if a URL is pasted.
		if ( ! isCollapsed( currentRecord ) ) {
			const trimmedText = ( pastedHtml || pastedText )
				.replace( /<[^>]+>/g, '' )
				.trim();

			// A URL was pasted, turn the selection into a link.
			if ( isURL( trimmedText ) ) {
				const linkedRecord = applyFormat( currentRecord, {
					type: 'a',
					attributes: {
						href: decodeEntities( trimmedText ),
					},
				} );
				valueHandler = valueToFormatHandler( linkedRecord );
				onChange( valueHandler );

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', trimmedText );

				return;
			}
		}

		if ( onPaste ) {
			onPaste( {
				value: currentRecord,
				onChange: onFormatChangeHandler,
				html: pastedHtml,
				plainText: pastedText,
				files,
				activeFormats,
			} );
		}
	}, []);
    const onFocusHandler = useCallback(() => {
		isTouchedHandler = true;

		const { unstableOnFocus, onSelectionChange } = props;

		if ( unstableOnFocus ) {
			unstableOnFocus();
		}

		// We know for certain that on focus, the old selection is invalid. It
		// will be recalculated on `selectionchange`.

		onSelectionChange( selectionStartHandler, selectionEndHandler );

		lastAztecEventTypeHandler = 'focus';
	}, []);
    const onBlurHandler = useCallback(( event ) => {
		isTouchedHandler = false;

		// Check if value is up to date with latest state of native AztecView.
		if (
			event.nativeEvent.text &&
			event.nativeEvent.text !== props.value
		) {
			onTextUpdateHandler( event );
		}

		if ( props.onBlur ) {
			props.onBlur( event );
		}

		lastAztecEventTypeHandler = 'blur';
	}, []);
    const onSelectionChangeHandler = useCallback(( start, end ) => {
		const hasChanged =
			selectionStartHandler !== start || selectionEndHandler !== end;

		selectionStartHandler = start;
		selectionEndHandler = end;

		// This is a manual selection change event if onChange was not triggered just before
		// and we did not just trigger a text update
		// `onChange` could be the last event and could have been triggered a long time ago so
		// this approach is not perfectly reliable.
		const isManual =
			lastAztecEventTypeHandler !== 'input' &&
			props.value === valueHandler;
		if ( hasChanged && isManual ) {
			const value = createRecordHandler();
			const activeFormats = getActiveFormats( value );
			setActiveFormats(activeFormats);
		}

		props.onSelectionChange( start, end );
	}, [activeFormats]);
    const shouldDropEventFromAztecHandler = useCallback(( event, logText ) => {
		const shouldDrop =
			! isIOSHandler && event.nativeEvent.eventCount <= lastEventCountHandler;
		if ( shouldDrop ) {
			window.console.log(
				`Dropping ${ logText } from Aztec as its event counter is older than latest sent to the native side. Got ${ event.nativeEvent.eventCount } but lastEventCount is ${ lastEventCountHandler }.`
			);
		}
		return shouldDrop;
	}, []);
    const onSelectionChangeFromAztecHandler = useCallback(( start, end, text, event ) => {
		if ( shouldDropEventFromAztecHandler( event, 'onSelectionChange' ) ) {
			return;
		}

		// `end` can be less than `start` on iOS
		// Let's fix that here so `rich-text/slice` can work properly.
		const realStart = Math.min( start, end );
		const realEnd = Math.max( start, end );

		// Check and dicsard stray event, where the text and selection is equal to the ones already cached.
		const contentWithoutRootTag = removeRootTagsProduceByAztecHandler(
			unescapeSpaces( event.nativeEvent.text )
		);
		if (
			contentWithoutRootTag === valueHandler &&
			realStart === selectionStartHandler &&
			realEnd === selectionEndHandler
		) {
			return;
		}

		comesFromAztecHandler = true;
		firedAfterTextChangedHandler = true; // Selection change event always fires after the fact.

		// Update text before updating selection
		// Make sure there are changes made to the content before upgrading it upward.
		onTextUpdateHandler( event );

		// Aztec can send us selection change events after it has lost focus.
		// For instance the autocorrect feature will complete a partially written
		// word when resigning focus, causing a selection change event.
		// Forwarding this selection change could cause this RichText to regain
		// focus and start a focus loop.
		//
		// See https://github.com/wordpress-mobile/gutenberg-mobile/issues/1696
		if ( props.__unstableIsSelected ) {
			onSelectionChangeHandler( realStart, realEnd );
		}
		// Update lastEventCount to prevent Aztec from re-rendering the content it just sent.
		lastEventCountHandler = event.nativeEvent.eventCount;

		lastAztecEventTypeHandler = 'selection change';
	}, []);
    const isEmptyHandler = useCallback(() => {
		return isEmpty( formatToValueHandler( props.value ) );
	}, []);
    const formatToValueHandler = useCallback(( value ) => {
		const { preserveWhiteSpace } = props;
		// Handle deprecated `children` and `node` sources.
		if ( Array.isArray( value ) ) {
			return create( {
				html: childrenBlock.toHTML( value ),
				multilineTag: multilineTagHandler,
				multilineWrapperTags: multilineWrapperTagsHandler,
				preserveWhiteSpace,
			} );
		}

		if ( props.format === 'string' ) {
			return create( {
				html: value,
				multilineTag: multilineTagHandler,
				multilineWrapperTags: multilineWrapperTagsHandler,
				preserveWhiteSpace,
			} );
		}

		// Guard for blocks passing `null` in onSplit callbacks. May be removed
		// if onSplit is revised to not pass a `null` value.
		if ( value === null ) {
			return create();
		}

		return value;
	}, []);
    const manipulateEventCounterToForceNativeToRefreshHandler = useCallback(() => {
		if ( isIOSHandler ) {
			lastEventCountHandler = undefined;
			return;
		}

		if ( typeof lastEventCountHandler !== 'undefined' ) {
			lastEventCountHandler += 100; // bump by a hundred, hopefully native hasn't bombarded the JS side in the meantime.
		} // no need to bump when 'undefined' as native side won't receive the key when the value is undefined, and that will cause force updating anyway,
		//   see https://github.com/WordPress/gutenberg/blob/82e578dcc75e67891c750a41a04c1e31994192fc/packages/react-native-aztec/android/src/main/java/org/wordpress/mobile/ReactNativeAztec/ReactAztecManager.java#L213-L215
	}, []);
    const shouldComponentUpdateHandler = useCallback(( nextProps, nextState ) => {
		if (
			nextProps.tagName !== props.tagName ||
			nextProps.reversed !== props.reversed ||
			nextProps.start !== props.start
		) {
			manipulateEventCounterToForceNativeToRefreshHandler(); // force a refresh on the native side
			valueHandler = undefined;
			return true;
		}

		// TODO: Please re-introduce the check to avoid updating the content right after an `onChange` call.
		// It was removed in https://github.com/WordPress/gutenberg/pull/12417 to fix undo/redo problem.

		// If the component is changed React side (undo/redo/merging/splitting/custom text actions)
		// we need to make sure the native is updated as well.

		// Also, don't trust the "this.lastContent" as on Android, incomplete text events arrive
		//  with only some of the text, while the virtual keyboard's suggestion system does its magic.
		// ** compare with this.lastContent for optimizing performance by not forcing Aztec with text it already has
		// , but compare with props.value to not lose "half word" text because of Android virtual keyb autosuggestion behavior
		if (
			typeof nextProps.value !== 'undefined' &&
			typeof props.value !== 'undefined' &&
			( ! comesFromAztecHandler || ! firedAfterTextChangedHandler ) &&
			nextProps.value !== props.value
		) {
			// Gutenberg seems to try to mirror the caret state even on events that only change the content so,
			//  let's force caret update if state has selection set.
			if (
				typeof nextProps.selectionStart !== 'undefined' &&
				typeof nextProps.selectionEnd !== 'undefined'
			) {
				needsSelectionUpdateHandler = true;
			}

			manipulateEventCounterToForceNativeToRefreshHandler(); // force a refresh on the native side
		}

		if ( ! comesFromAztecHandler ) {
			if (
				typeof nextProps.selectionStart !== 'undefined' &&
				typeof nextProps.selectionEnd !== 'undefined' &&
				nextProps.selectionStart !== props.selectionStart &&
				nextProps.selectionStart !== selectionStartHandler &&
				nextProps.__unstableIsSelected
			) {
				needsSelectionUpdateHandler = true;
				manipulateEventCounterToForceNativeToRefreshHandler(); // force a refresh on the native side
			}

			// For font size changes from a prop value a force refresh
			// is needed without the selection update.
			if ( nextProps?.fontSize !== props?.fontSize ) {
				manipulateEventCounterToForceNativeToRefreshHandler(); // force a refresh on the native side
			}

			if (
				( nextProps?.style?.fontSize !== props?.style?.fontSize &&
					nextState.currentFontSize !==
						currentFontSize ) ||
				nextState.currentFontSize !== currentFontSize ||
				nextProps?.style?.lineHeight !== props?.style?.lineHeight
			) {
				needsSelectionUpdateHandler = true;
				manipulateEventCounterToForceNativeToRefreshHandler(); // force a refresh on the native side
			}
		}

		return true;
	}, [currentFontSize]);
    useEffect(() => {
		// Request focus if wrapping block is selected and parent hasn't inhibited the focus request. This method of focusing
		//  is trying to implement the web-side counterpart of BlockList's `focusTabbable` where the BlockList is focusing an
		//  inputbox by searching the DOM. We don't have the DOM in RN so, using the combination of blockIsSelected and __unstableMobileNoFocusOnMount
		//  to determine if we should focus the RichText.
		if (
			props.blockIsSelected &&
			! props.__unstableMobileNoFocusOnMount
		) {
			_editorHandler.focus();
			onSelectionChangeHandler(
				props.selectionStart || 0,
				props.selectionEnd || 0
			);
		}
	}, []);
    useEffect(() => {
    return () => {
		if ( _editorHandler.isFocused() ) {
			_editorHandler.blur();
		}
	};
}, []);
    useEffect(() => {
		const { style, tagName } = props;
		

		if ( props.value !== valueHandler ) {
			valueHandler = props.value;
		}
		const { __unstableIsSelected: isSelected } = props;

		const { __unstableIsSelected: prevIsSelected } = prevProps;

		if ( isSelected && ! prevIsSelected ) {
			_editorHandler.focus();
			// Update selection props explicitly when component is selected as Aztec won't call onSelectionChange
			// if its internal value hasn't change. When created, default value is 0, 0.
			onSelectionChangeHandler(
				props.selectionStart || 0,
				props.selectionEnd || 0
			);
		} else if ( ! isSelected && prevIsSelected ) {
			_editorHandler.blur();
		}

		// For font size values changes from the font size picker
		// we compare previous values to refresh the selected font size,
		// this is also used when the tag name changes
		// e.g Heading block and a level change like h1->h2.
		const currentFontSizeStyle = getParsedFontSize( style?.fontSize );
		const prevFontSizeStyle = getParsedFontSize(
			prevProps?.style?.fontSize
		);
		const isDifferentTag = prevProps.tagName !== tagName;
		if (
			( currentFontSize &&
				( currentFontSizeStyle || prevFontSizeStyle ) &&
				currentFontSizeStyle !== currentFontSize ) ||
			isDifferentTag
		) {
			setCurrentFontSize(getFontSizeHandler( props ));
		}
	}, [currentFontSize]);
    const getHtmlToRenderHandler = useCallback(( record, tagName ) => {
		// Save back to HTML from React tree.
		let value = valueToFormatHandler( record );

		if ( value === undefined ) {
			manipulateEventCounterToForceNativeToRefreshHandler(); // force a refresh on the native side
			value = '';
		}
		// On android if content is empty we need to send no content or else the placeholder will not show.
		if (
			! isIOSHandler &&
			( value === '' || value === EMPTY_PARAGRAPH_TAGS )
		) {
			return '';
		}

		if ( tagName ) {
			let extraAttributes = ``;
			if ( tagName === `ol` ) {
				if ( props.reversed ) {
					extraAttributes += ` reversed`;
				}
				if ( props.start ) {
					extraAttributes += ` start=${ props.start }`;
				}
			}
			value = `<${ tagName }${ extraAttributes }>${ value }</${ tagName }>`;
		}
		return value;
	}, []);
    const getEditablePropsHandler = useCallback(() => {
		return {
			// Overridable props.
			style: {},
			className: 'rich-text',
			onKeyDown: () => null,
		};
	}, []);
    const getParsedFontSize = useMemo(() => {
		const { height, width } = Dimensions.get( 'window' );
		const cssUnitOptions = { height, width, fontSize: DEFAULT_FONT_SIZE };

		if ( ! fontSize ) {
			return fontSize;
		}

		const selectedPxValue =
			getPxFromCssUnit( fontSize, cssUnitOptions ) ?? DEFAULT_FONT_SIZE;

		return parseFloat( selectedPxValue );
	}, []);
    const getFontSizeHandler = useCallback(( props ) => {
		const { baseGlobalStyles, tagName, fontSize, style } = props;
		const tagNameFontSize =
			baseGlobalStyles?.elements?.[ tagName ]?.typography?.fontSize;

		let newFontSize = DEFAULT_FONT_SIZE;

		// For block-based themes, get the default editor font size.
		if ( baseGlobalStyles?.typography?.fontSize && tagName === 'p' ) {
			newFontSize = baseGlobalStyles?.typography?.fontSize;
		}

		// For block-based themes, get the default element font size
		// e.g h1, h2.
		if ( tagNameFontSize ) {
			newFontSize = tagNameFontSize;
		}

		// For font size values provided from the styles,
		// usually from values set from the font size picker.
		if ( style?.fontSize ) {
			newFontSize = style.fontSize;
		}

		// Fall-back to a font size provided from its props (if there's any)
		// and there are no other default values to use.
		if ( fontSize && ! tagNameFontSize && ! style?.fontSize ) {
			newFontSize = fontSize;
		}

		// We need to always convert to px units because the selected value
		// could be coming from the web where it could be stored as a different unit.
		const selectedPxValue = getParsedFontSize( newFontSize );

		return selectedPxValue;
	}, []);
    const getLineHeightHandler = useCallback(() => {
		const { baseGlobalStyles, tagName, lineHeight, style } = props;
		const tagNameLineHeight =
			baseGlobalStyles?.elements?.[ tagName ]?.typography?.lineHeight;
		let newLineHeight;

		if ( ! getIsBlockBasedThemeHandler() ) {
			return;
		}

		// For block-based themes, get the default editor line height.
		if ( baseGlobalStyles?.typography?.lineHeight && tagName === 'p' ) {
			newLineHeight = parseFloat(
				baseGlobalStyles?.typography?.lineHeight
			);
		}

		// For block-based themes, get the default element line height
		// e.g h1, h2.
		if ( tagNameLineHeight ) {
			newLineHeight = parseFloat( tagNameLineHeight );
		}

		// For line height values provided from the styles,
		// usually from values set from the line height picker.
		if ( style?.lineHeight ) {
			newLineHeight = parseFloat( style.lineHeight );
		}

		// Fall-back to a line height provided from its props (if there's any)
		// and there are no other default values to use.
		if ( lineHeight && ! tagNameLineHeight && ! style?.lineHeight ) {
			newLineHeight = lineHeight;
		}

		// Check the final value is not over the minimum supported value.
		if ( newLineHeight && newLineHeight < MIN_LINE_HEIGHT ) {
			newLineHeight = MIN_LINE_HEIGHT;
		}

		return newLineHeight;
	}, []);
    const getIsBlockBasedThemeHandler = useCallback(() => {
		const { baseGlobalStyles } = props;

		return (
			baseGlobalStyles && Object.entries( baseGlobalStyles ).length !== 0
		);
	}, []);
    const getBlockUseDefaultFontHandler = useCallback(() => {
		// For block-based themes it enables using the defaultFont
		// in Aztec for iOS so it allows customizing the font size
		// for the Preformatted/Code and Heading blocks.
		if ( ! isIOSHandler ) {
			return;
		}

		const { tagName } = props;
		const isBlockBasedTheme = getIsBlockBasedThemeHandler();
		const tagsToMatch = /pre|h([1-6])$/gm;

		return isBlockBasedTheme && tagsToMatch.test( tagName );
	}, []);
    const getLinkTextColorHandler = useCallback(( defaultColor ) => {
		const { style } = props;
		const customColor = style?.linkColor && colord( style.linkColor );

		return customColor && customColor.isValid()
			? customColor.toHex()
			: defaultColor;
	}, []);

    const {
			tagName,
			style,
			__unstableIsSelected: isSelected,
			children,
			getStylesFromColorScheme,
			minWidth,
			maxWidth,
			formatTypes,
			parentBlockStyles,
			accessibilityLabel,
			disableEditingMenu = false,
			baseGlobalStyles,
			selectionStart,
			selectionEnd,
			disableSuggestions,
			containerWidth,
		} = props;
		

		const record = getRecordHandler();
		const html = getHtmlToRenderHandler( record, tagName );
		const editableProps = getEditablePropsHandler();
		const blockUseDefaultFont = getBlockUseDefaultFontHandler();

		const placeholderStyle = getStylesFromColorScheme(
			styles.richTextPlaceholder,
			styles.richTextPlaceholderDark
		);

		const { color: defaultPlaceholderTextColor } = placeholderStyle;
		const fontSize = currentFontSize;
		const lineHeight = getLineHeightHandler();

		const {
			color: defaultColor,
			textDecorationColor: defaultTextDecorationColor,
			fontFamily: defaultFontFamily,
		} = getStylesFromColorScheme( styles.richText, styles.richTextDark );
		const linkTextColor = getLinkTextColorHandler(
			defaultTextDecorationColor
		);

		const currentSelectionStart = selectionStart ?? 0;
		const currentSelectionEnd = selectionEnd ?? 0;
		let selection = null;
		if ( needsSelectionUpdateHandler ) {
			needsSelectionUpdateHandler = false;
			selection = {
				start: currentSelectionStart,
				end: currentSelectionEnd,
			};

			// On AztecAndroid, setting the caret to an out-of-bounds position will crash the editor so, let's check for some cases.
			if ( ! isIOSHandler ) {
				// The following regular expression is used in Aztec here:
				// https://github.com/wordpress-mobile/AztecEditor-Android/blob/b1fad439d56fa6d4aa0b78526fef355c59d00dd3/aztec/src/main/kotlin/org/wordpress/aztec/AztecParser.kt#L656
				const brBeforeParaMatches = html.match( /(<br>)+<\/p>$/g );
				if ( brBeforeParaMatches ) {
					console.warn(
						'Oops, BR tag(s) at the end of content. Aztec will remove them, adapting the selection...'
					);
					const count = (
						brBeforeParaMatches[ 0 ].match( /br/g ) || []
					).length;
					if ( count > 0 ) {
						let newSelectionStart = currentSelectionStart - count;
						if ( newSelectionStart < 0 ) {
							newSelectionStart = 0;
						}
						let newSelectionEnd = currentSelectionEnd - count;
						if ( newSelectionEnd < 0 ) {
							newSelectionEnd = 0;
						}
						selection = {
							start: newSelectionStart,
							end: newSelectionEnd,
						};
					}
				}
			}
		}

		if ( comesFromAztecHandler ) {
			comesFromAztecHandler = false;
			firedAfterTextChangedHandler = false;
		}

		// Logic below assures that `RichText` width will always have equal value when container is almost fully filled.
		const width =
			maxWidth && width && maxWidth - width < 10
				? maxWidth
				: width;
		const containerStyles = [
			style?.padding &&
				style?.backgroundColor && {
					padding: style.padding,
					backgroundColor: style.backgroundColor,
				},
			containerWidth && {
				width: containerWidth,
			},
		];

		const EditableView = ( props ) => {
			customEditableOnKeyDownHandler = props?.onKeyDown;

			return <></>;
		};

		return (
			<View style={ containerStyles }>
				{ children &&
					children( {
						isSelected,
						value: record,
						onChange: onFormatChangeHandler,
						onFocus: () => {},
						editableProps,
						editableTagName: EditableView,
					} ) }
				<RCTAztecView
					accessibilityLabel={ accessibilityLabel }
					ref={ ( ref ) => {
						_editorHandler = ref;

						if ( props.setRef ) {
							props.setRef( ref );
						}
					} }
					style={ {
						backgroundColor: styles.richText.backgroundColor,
						...style,
						...( isIOSHandler && minWidth && maxWidth
							? { width }
							: { maxWidth } ),
						minHeight: height,
					} }
					blockUseDefaultFont={ blockUseDefaultFont }
					text={ {
						text: html,
						eventCount: lastEventCountHandler,
						selection,
						linkTextColor,
						tag: tagName,
					} }
					placeholder={ props.placeholder }
					placeholderTextColor={
						style?.placeholderColor ||
						props.placeholderTextColor ||
						( baseGlobalStyles && baseGlobalStyles?.color?.text ) ||
						defaultPlaceholderTextColor
					}
					deleteEnter={ props.deleteEnter }
					onChange={ onChangeFromAztecHandler }
					onFocus={ onFocusHandler }
					onBlur={ onBlurHandler }
					onKeyDown={ onKeyDownHandler }
					triggerKeyCodes={
						disableEditingMenu
							? []
							: suggestionOptionsHandler().map(
									( op ) => op.triggerChar
							  )
					}
					onPaste={ onPasteHandler }
					activeFormats={ getActiveFormatNamesHandler( record ) }
					onContentSizeChange={ onContentSizeChangeHandler }
					onCaretVerticalPositionChange={
						props.onCaretVerticalPositionChange
					}
					onSelectionChange={ onSelectionChangeFromAztecHandler }
					blockType={ { tag: tagName } }
					color={
						( style && style.color ) ||
						( parentBlockStyles && parentBlockStyles.color ) ||
						( baseGlobalStyles && baseGlobalStyles?.color?.text ) ||
						defaultColor
					}
					maxImagesWidth={ 200 }
					fontFamily={ props.fontFamily || defaultFontFamily }
					fontSize={ fontSize }
					lineHeight={ lineHeight }
					fontWeight={ props.fontWeight }
					fontStyle={ props.fontStyle }
					disableEditingMenu={ disableEditingMenu }
					isMultiline={ isMultilineHandler }
					textAlign={ props.textAlign }
					{ ...( isIOSHandler ? { maxWidth } : {} ) }
					minWidth={ minWidth }
					id={ props.id }
					selectionColor={ props.selectionColor }
					disableAutocorrection={ props.disableAutocorrection }
				/>
				{ isSelected && (
					<>
						<FormatEdit
							forwardedRef={ _editorHandler }
							formatTypes={ formatTypes }
							value={ record }
							onChange={ onFormatChangeHandler }
							onFocus={ () => {} }
						/>
						{ ! disableSuggestions && (
							<BlockFormatControls>
								<ToolbarButtonWithOptions
									options={ suggestionOptionsHandler() }
								/>
							</BlockFormatControls>
						) }
					</>
				) }
			</View>
		); 
};




RichText.defaultProps = {
	format: 'string',
	value: '',
	tagName: 'div',
};

const withFormatTypes = ( WrappedComponent ) => ( props ) => {
	const {
		clientId,
		identifier,
		withoutInteractiveFormatting,
		allowedFormats,
	} = props;
	const { formatTypes } = useFormatTypes( {
		clientId,
		identifier,
		withoutInteractiveFormatting,
		allowedFormats,
	} );

	return <WrappedComponent { ...props } formatTypes={ formatTypes } />;
};

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlockParents, getBlock, getSettings } =
			select( 'core/block-editor' );
		const parents = getBlockParents( clientId, true );
		const parentBlock = parents ? getBlock( parents[ 0 ] ) : undefined;
		const parentBlockStyles = parentBlock?.attributes?.childrenStyles;

		const settings = getSettings();
		const baseGlobalStyles = settings?.__experimentalGlobalStylesBaseStyles;

		const colorPalettes = settings?.__experimentalFeatures?.color?.palette;
		const colorPalette = colorPalettes
			? flatColorPalettes( colorPalettes )
			: settings?.colors;

		return {
			areMentionsSupported:
				getSettings( 'capabilities' ).mentions === true,
			areXPostsSupported: getSettings( 'capabilities' ).xposts === true,
			...{ parentBlockStyles },
			baseGlobalStyles,
			colorPalette,
		};
	} ),
	withPreferredColorScheme,
	withFormatTypes,
] )( RichText );
