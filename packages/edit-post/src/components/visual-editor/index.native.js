/**
 * WordPress dependencies
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { BlockList } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import { Keyboard } from 'react-native';
/**
 * Internal dependencies
 */
import Header from './header';

export default export const VisualEditor = (props) => {


    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

    useEffect(() => {
		this.keyboardDidShow = Keyboard.addListener(
			'keyboardDidShow',
			this.keyboardDidShow
		);
		this.keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			this.keyboardDidHide
		);
	}, []);
    useEffect(() => {
    return () => {
		this.keyboardDidShow.remove();
		this.keyboardDidHideListener.remove();
	};
}, []);
    const keyboardDidShowHandler = useCallback(() => {
		this.setState( { isAutoScrollEnabled: false } );
	}, []);
    const keyboardDidHideHandler = useCallback(() => {
		this.setState( { isAutoScrollEnabled: true } );
	}, []);
    const renderHeaderHandler = useCallback(() => {
		const { setTitleRef } = this.props;
		return <Header setTitleRef={ setTitleRef } />;
	}, []);

    const { safeAreaBottomInset } = this.props;
		const { isAutoScrollEnabled } = this.state;

		return (
			<BlockList
				header={ this.renderHeader }
				safeAreaBottomInset={ safeAreaBottomInset }
				autoScroll={ isAutoScrollEnabled }
			/>
		); 
};



