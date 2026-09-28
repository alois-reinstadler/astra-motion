import { hydrate } from 'svelte';
import Fixture from '@fixture';
hydrate(Fixture, { target: document.getElementById('app')! });
