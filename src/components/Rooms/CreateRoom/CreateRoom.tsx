import React, { useState, useEffect, useContext } from 'react';
import { CircularProgress, FormControl, InputLabel, Input, FormHelperText, Switch, FormControlLabel, Card, CardContent, CardHeader, CardActions, Button, FormLabel, FormGroup, Checkbox } from '@material-ui/core';

import './CreateRoom.scss';
import useFetchData, { FetchType } from '../../../Hooks/useFetchData';
import { SnackbarContext } from '../../../Contexts/SnackbarProvider';

function DeckSelector({ decks, onChange }: { decks: any[], onChange: (decks: string[]) => void }) {
  const [deckOptions, setDeckOptions] = useState<{ name: string; _id: string, value?: boolean }[]>([]);

  useEffect(() => {
    if (decks) {
      setDeckOptions(decks.map(deck => {
        return { value: deck.name.includes('Base'), ...deck }
      }));
    }
  }, [decks]);

  useEffect(() => {
    onChange(deckOptions.filter(deck => deck.value).map(deck => deck._id));
  }, [deckOptions, onChange]);

  function _onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDeckOptions(prevDeck => {
      const deck = prevDeck.find(deck => deck._id === e.target.name);
      if (deck) {
        deck.value = e.target.checked;
      }
      return [...prevDeck];
    });
  }

  if (!decks?.length) {
    return null;
  }

  return <FormControl required component="fieldset" error={!deckOptions.some(deck => deck.value)}>
    <FormLabel component="legend">Select which decks you would like to play with</FormLabel>
    <FormGroup>
      {deckOptions.map(deck => {
        return <FormControlLabel
          key={deck._id}
          control={<Checkbox checked={deck.value} onChange={_onChange} name={deck._id} />}
          label={deck.name}
        />
      })}
    </FormGroup>
    <FormHelperText>You must select at least one</FormHelperText>
  </FormControl>
}

export default function CreateRoom({ onJoin, decksData }: any) {
  const { openSnack } = useContext(SnackbarContext);
  const [isProtected, setIsProtected] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [name, setName] = useState('');
  const [target, setTarget] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [maxSpectators, setMaxSpectators] = useState(10);
  const [, isLoading, , createRoom] = useFetchData(`/api/rooms`, FetchType.POST);
  const [decks, setDecks] = useState([]);
  const [errorField, setErrorField] = useState<string | null>(null);

  function handleSubmit() {
    const room = {
      name,
      options: {
        target,
        maxPlayers,
        maxSpectators,
        decks
      },
    }
    if (isProtected && passcode.length) {
      (room as any).passcode = passcode;
    }
    createRoom(room)
      .then((axiosRes) => {
        onJoin(axiosRes.data._id, passcode);
      })
      .catch((err) => {
        if (err?.response?.data.type === 'VALIDATION_ERROR') {
          const errObj = err?.response?.data.data[0];
          setErrorField(errObj.field as string);
        }
        openSnack({ text: 'Something went wrong...', severity: 'error' });
      });
  }

  function onKeyPress(e: any) {
    if (e.charCode === 13) {
      handleSubmit();
    }
  }

  function renderPasswordForm() {
    if (!isProtected) {
      return null;
    }

    return <FormControl error={errorField === 'passcode'}>
      <InputLabel htmlFor="passcode">Password</InputLabel>
      <Input id="passcode" aria-describedby="password-helper" required={false} value={passcode} onChange={e => setPasscode(e.target.value)} />
      <FormHelperText id="password-helper">
        {errorField !== 'passcode' ? 'People will need this password to enter your game.' : 'Password must be between 4-12 characters long with no special characters.'}
      </FormHelperText>
    </FormControl>;
  }

  function renderCardContent() {
    return <CardContent className="create-form-card-content">
      <form className="create-room-form" onKeyPress={onKeyPress}>
        <FormControl required={true} error={errorField === 'name'}>
          <InputLabel htmlFor="name">Game Name</InputLabel>
          <Input id="name" autoFocus={true} aria-describedby="game-name-helper" value={name} onChange={e => setName(e.target.value)} />
          {errorField === 'name' ? <FormHelperText id="score-helper">Game name must be between 2-16 characters long with no special characters!</FormHelperText> : null}
        </FormControl>
        <FormControl required={true}>
          <InputLabel htmlFor="target">Target Score</InputLabel>
          <Input id="target" type="number" aria-describedby="score-helper" value={target} onChange={e => setTarget(parseInt(e.target.value, 10))} />
          <FormHelperText id="score-helper">Number of points required to end the game.</FormHelperText>
        </FormControl>
        <FormControl required={true}>
          <InputLabel htmlFor="max-players">Max Players</InputLabel>
          <Input id="max-players" type="number" aria-describedby="max-players-helper" value={maxPlayers} onChange={e => setMaxPlayers(parseInt(e.target.value, 10))} />
        </FormControl>
        <FormControl required={true}>
          <InputLabel htmlFor="max-spectators">Max Spectators</InputLabel>
          <Input id="max-spectators" type="number" aria-describedby="max-spectators-helper" value={maxSpectators} onChange={e => setMaxSpectators(parseInt(e.target.value, 10))} />
        </FormControl>
        {!decksData?.rows ? null : <DeckSelector decks={decksData.rows} onChange={setDecks as any} />}
        <FormControlLabel
          control={<Switch checked={isProtected} onChange={e => setIsProtected(e.target.checked)} name="checkedA" />}
          label="Password"
        />
        {renderPasswordForm()}
      </form>
      <CardActions>
        {!isLoading ? <Button variant="contained" color="primary" size="small" onClick={handleSubmit}>Create</Button> : <CircularProgress />}
      </CardActions>
    </CardContent>
  }

  return <Card className="form-container" variant="elevation">
    <CardHeader title="Create Game" subheader="Invite your friends!" />
    {renderCardContent()}
  </Card>
}