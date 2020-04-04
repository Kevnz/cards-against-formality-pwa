import React, { useState, useCallback, useContext } from 'react';
import axios from 'axios';
import { Container, Button, Input, CircularProgress, Card, CardHeader, CardContent, FormControl, InputLabel, FormHelperText } from '@material-ui/core';

import Message, { MessageType } from '../Message/Message';
import { RouterContext } from '../../Contexts/RouteProvider';
import './Login.scss';

axios.defaults.withCredentials = true;

export interface LoginProps {
  login: (username: string) => Promise<string>;
}
// '^[a-zA-Z0-9]+([_ -]?[a-zA-Z0-9])*$'
export default function Login({ login }: LoginProps) {
  const { history } = useContext(RouterContext);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState({ text: '', type: MessageType.DEFAULT });
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = useCallback(_handleLogin, [username, login, setMessage, setIsLoading, history]);
  const onChange = useCallback(_onChange, [handleLogin]);

  function _onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setUsername(e.target.value);
  }

  function onKeyPress(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.charCode === 13) {
      handleLogin();
    }
  }

  function _handleLogin() {
    setIsLoading(true);
    login(username)
      .then(() => {
        setIsLoading(false);
        if (history) {
          history.push('/rooms');
        }
      })
      .catch((msg: string) => {
        setIsLoading(false);
        setMessage({ text: msg, type: MessageType.ERROR });
      });
  }

  function renderButton() {
    if (!isLoading) {
      return <Button variant="contained" color="primary" disabled={!username.length} onClick={handleLogin}>
        Login
      </Button>;
    }
    return <CircularProgress />;
  }

  return <>
    <Container maxWidth="md" className="login-wrapper">
      <Card className="inner-login-container" raised={true}>
        <CardHeader className="header" title="Let's Play!"></CardHeader>
        <CardContent>
          <div className="input-wrapper">
            <FormControl className="username-input" required={true} error={!!message.text?.length}>
              <InputLabel htmlFor="target">Username</InputLabel>
              <Input onKeyPress={onKeyPress} autoFocus={true} id="target" aria-describedby="username-helper" value={username} onChange={onChange} />
              <FormHelperText id="username-helper">Enter a name unique name</FormHelperText>
            </FormControl>
            {renderButton()}
          </div>
          <Message message={message} />
        </CardContent>
      </Card>
    </Container>
  </>
}